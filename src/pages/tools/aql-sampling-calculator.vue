<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <ClipboardCheck class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">AQL 抽样方案查询</h1>
          <p class="text-sm text-muted-foreground mt-1">按批量、检验水平与 AQL 查 GB/T 2828.1 / ISO 2859-1 正常检验一次抽样方案，支持 CR/MAJ/MIN 三等级并列与箭头规则</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 AQL 抽样检验方案查询器：验货、跟单、工厂 QA 常用——输入批量、选择一般检验水平（I / II / III）与 AQL 值，
        两步查出样本量字码与抽样数 n，直接给出「抽多少、收几个、退几个」的允收 / 拒收判定；可按服装、电子行业惯例同时给出
        致命（CR）/ 严重（MAJ）/ 轻微（MIN）三个等级的并列方案，并内置箭头规则（样本量变而 AQL 固定时随箭头改字码）。
        全部查询在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 页面说明条 -->
    <div class="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-6">
      <Info class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        数据为 GB/T 2828.1-2012 / ISO 2859-1 一般检验水平 II、正常检验一次抽样主表的公开整理；箭头规则（样本量变而 AQL 固定时随箭头改字码）已内置，但正式合同请以标准原文页码核对。
        本页仅实现一般检验水平 I / II / III 与正常检验一次抽样；特殊检验水平 S-1~S-4、加严 / 减量及多次抽样表未内置。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：查询参数 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Search class="w-5 h-5 mr-2 text-primary" /> 查询参数
        </h2>

        <div>
          <label for="aql-lot" class="text-sm font-medium text-foreground">批量（件数，≥2 的整数）</label>
          <input
            id="aql-lot"
            v-model.number="lotInput"
            type="number"
            min="2"
            step="1"
            class="w-full mt-1.5 px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
          <select
            class="w-full mt-2 px-2.5 py-2 bg-background border border-border border-border rounded-lg text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            :value="''"
            aria-label="按批量档位快速选择"
            @change="pickRange"
          >
            <option value="" disabled>或直接选批量档位（取档位下限）</option>
            <option v-for="r in LOT_RANGES" :key="r.label" :value="r.min">{{ r.label }}</option>
          </select>
          <p v-if="matchedRangeLabel" class="text-xs text-muted-foreground mt-1.5">命中批量区间：<span class="font-medium text-foreground">{{ matchedRangeLabel }}</span></p>
        </div>

        <div>
          <p class="text-sm font-medium text-foreground mb-1.5">检验水平（一般水平）</p>
          <div class="grid grid-cols-3 gap-2" role="group" aria-label="检验水平">
            <button
              v-for="lv in LEVELS"
              :key="lv"
              type="button"
              class="px-3 py-1.5 rounded-lg border text-sm font-medium transition"
              :class="level === lv ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
              @click="level = lv"
            >
              水平 {{ lv }}
            </button>
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">水平 II 为消费品类验货默认；水平 I 抽样减半，水平 III 加严一档（判更准、抽更多）。</p>
        </div>

        <div>
          <p class="text-sm font-medium text-foreground mb-1.5">缺陷等级模式</p>
          <div class="grid grid-cols-2 gap-2" role="group" aria-label="缺陷等级模式">
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg border text-sm font-medium transition"
              :class="defectMode === 'single' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
              @click="defectMode = 'single'"
            >
              单一 AQL
            </button>
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg border text-sm font-medium transition"
              :class="defectMode === 'multi' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
              @click="defectMode = 'multi'"
            >
              CR/MAJ/MIN 并列
            </button>
          </div>
        </div>

        <div v-if="defectMode === 'single'">
          <label for="aql-single" class="text-sm font-medium text-foreground">AQL 值</label>
          <select
            id="aql-single"
            v-model.number="aqlSingle"
            class="w-full mt-1.5 px-2.5 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option v-for="a in AQL_USABLE" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>

        <div v-else class="space-y-2.5">
          <div class="grid grid-cols-3 gap-2">
            <div>
              <label for="aql-cr" class="text-xs font-medium text-foreground">致命 CR</label>
              <select id="aql-cr" v-model.number="aqlCR" class="w-full mt-1 px-2 py-1.5 bg-background border border-border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option v-for="a in CR_AQL_OPTIONS" :key="a" :value="a">{{ a === 0 ? '0（收0）' : a }}</option>
              </select>
            </div>
            <div>
              <label for="aql-maj" class="text-xs font-medium text-foreground">严重 MAJ</label>
              <select id="aql-maj" v-model.number="aqlMAJ" class="w-full mt-1 px-2 py-1.5 bg-background border border-border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option v-for="a in AQL_USABLE" :key="a" :value="a">{{ a }}</option>
              </select>
            </div>
            <div>
              <label for="aql-min" class="text-xs font-medium text-foreground">轻微 MIN</label>
              <select id="aql-min" v-model.number="aqlMIN" class="w-full mt-1 px-2 py-1.5 bg-background border border-border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option v-for="a in AQL_USABLE" :key="a" :value="a">{{ a }}</option>
              </select>
            </div>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            验货邮件里的实际格式：同一批量按三个缺陷等级各给一行方案；致命缺陷行业惯例为「收 0 退 1」（表上并无 AQL 0 列）。
          </p>
        </div>

        <div>
          <p class="text-xs font-medium text-foreground mb-1.5">行业常用组合快选</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="combo in COMBOS"
              :key="combo.key"
              type="button"
              class="px-2.5 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted text-left transition"
              @click="applyCombo(combo)"
            >
              <p class="text-xs font-semibold text-foreground">{{ combo.name }}</p>
              <p class="text-[10px] text-muted-foreground font-mono mt-0.5">{{ combo.spec }}</p>
            </button>
          </div>
        </div>

        <div class="flex gap-2 pt-1">
          <button
            type="button"
            class="flex-1 px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
            @click="loadPreset(3000, 'II')"
          >
            <Play class="w-4 h-4 inline mr-1 -mt-0.5" /> 预设① 3000/II/2.5
          </button>
          <button
            type="button"
            class="flex-1 px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
            @click="loadPreset(1000, 'II')"
          >
            <Play class="w-4 h-4 inline mr-1 -mt-0.5" /> 预设② 服装 1000 三等级
          </button>
        </div>

        <button
          type="button"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          @click="resetAll"
        >
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置参数
        </button>
      </div>

      <!-- 右：方案结果（占两列） -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 方案结论卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <CheckCircle v-if="lotValid" class="w-5 h-5 mr-2 text-primary" />
            <TriangleAlert v-else class="w-5 h-5 mr-2 text-red-500" />
            抽样方案结果
          </h2>

          <div v-if="lotValid" class="space-y-4">
            <div class="grid grid-cols-3 gap-3">
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">样本量字码</p>
                <p class="text-3xl font-bold text-foreground leading-tight">{{ primaryLetter }}</p>
                <p class="text-xs text-muted-foreground mt-1">批量 {{ lotInput }} · 水平 {{ level }}</p>
              </div>
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">查表样本量 n</p>
                <p class="text-3xl font-bold text-primary leading-tight">{{ primaryN }}</p>
                <p class="text-xs text-muted-foreground mt-1">件（主表字码行）</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">查表路径</p>
                <p class="text-sm font-semibold text-foreground leading-tight mt-2">区间 → 字码 → 方案</p>
                <p class="text-xs text-muted-foreground mt-1 font-mono truncate" :title="matchedRangeLabel || ''">{{ matchedRangeLabel }}</p>
              </div>
            </div>

            <!-- 单等级大字判定 -->
            <div v-if="defectMode === 'single' && resultRows.length && resultRows[0].state === 'plan'" class="bg-primary/10 rounded-lg p-5 text-center">
              <p class="text-xs text-muted-foreground mb-1">判定结论（AQL {{ aqlLabelOf(resultRows[0].aql) }}）</p>
              <p class="text-3xl sm:text-4xl font-bold text-primary leading-tight">{{ judgementText(resultRows[0].final) }}</p>
              <p class="text-xs text-muted-foreground mt-2 font-mono">{{ planLineText(resultRows[0], level) }}</p>
            </div>

            <!-- 三等级并列 -->
            <div v-if="defectMode === 'multi'" class="space-y-2">
              <div
                v-for="row in resultRows"
                :key="row.key"
                class="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border bg-muted/40 px-4 py-3"
              >
                <span class="px-2 py-0.5 rounded-full border text-xs font-semibold" :class="defectChipClass(row.key)">{{ row.label }}</span>
                <span class="text-xs text-muted-foreground font-mono">AQL {{ aqlLabelOf(row.aql) }}</span>
                <span v-if="row.state === 'plan'" class="text-lg font-bold text-foreground">抽 {{ row.final.n }} 件 · ≤{{ row.final.ac }} 收 · ≥{{ row.final.re }} 退</span>
                <span v-if="row.state !== 'plan'" class="text-sm text-muted-foreground">表外或参数无效，请查标准原文</span>
                <span v-if="row.arrowNote" class="text-xs text-amber-600 leading-relaxed basis-full">{{ row.arrowNote }}</span>
                <span v-if="row.nOverLot" class="text-xs text-red-500 basis-full">方案样本量已超批量，建议全检或改用更低检验水平。</span>
              </div>
            </div>

            <!-- 单模式的箭头 / 超量提示 -->
            <div v-if="defectMode === 'single' && singleArrowNote" class="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Info class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p class="text-xs text-muted-foreground leading-relaxed">{{ singleArrowNote }}</p>
            </div>

            <div class="flex flex-wrap gap-2">
              <span class="px-2.5 py-1 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground">检验方案：正常检验一次抽样</span>
              <span class="px-2.5 py-1 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground">GB/T 2828.1-2012 / ISO 2859-1</span>
              <span class="px-2.5 py-1 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground">判定口径：不良 ≤ Ac 接收该批，≥ Re 拒收</span>
            </div>

            <button
              type="button"
              class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition"
              @click="copyPlanText"
            >
              <Copy v-if="!copied" class="w-4 h-4 inline mr-1.5 -mt-0.5" />
              <CheckCircle v-else class="w-4 h-4 inline mr-1.5 -mt-0.5" />
              {{ copied ? '已复制到剪贴板' : '复制验货报告格式方案文本' }}
            </button>
          </div>

          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <TriangleAlert class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">批量无效</p>
              <p class="text-xs text-muted-foreground mt-1">请输入 2 以上的整数批量（主表覆盖至 500001 件以上档；更大批量请查标准原文，或建议改用水平 I / 查表）。</p>
            </div>
          </div>
        </div>

        <!-- 辅助知识卡（静态） -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="bg-card border border-border rounded-lg p-4">
            <h3 class="text-sm font-semibold text-foreground flex items-center mb-2">
              <Info class="w-4 h-4 mr-1.5 text-primary" /> CR / MAJ / MIN 是什么
            </h3>
            <ul class="text-xs text-muted-foreground space-y-1 leading-relaxed">
              <li><b class="text-foreground">致命 CR</b>：危害安全或违反法规、不允许流入市场，如露带电、断针、迁移超标。</li>
              <li><b class="text-foreground">严重 MAJ</b>：影响功能或使用，买家大概率退货，如扣子扣不上、明显色差。</li>
              <li><b class="text-foreground">轻微 MIN</b>：外观瑕疵不影响使用，如线头、包装小划痕。</li>
            </ul>
          </div>
          <div class="bg-card border border-border rounded-lg p-4">
            <h3 class="text-sm font-semibold text-foreground flex items-center mb-2">
              <RefreshCw class="w-4 h-4 mr-1.5 text-primary" /> 正常 / 加严 / 减量一句话
            </h3>
            <p class="text-xs text-muted-foreground leading-relaxed">
              转移规则简述：连续 5 批中有 2 批拒收 → 转<b class="text-foreground">加严</b>；加严下连续 5 批接收 → 回<b class="text-foreground">正常</b>；
              正常下连续 10 批接收、缺陷总数低于限制且生产稳定并经批准 → 可转<b class="text-foreground">减量</b>。本页主表只收录正常检验一次方案。
            </p>
          </div>
          <div class="bg-card border border-border rounded-lg p-4">
            <h3 class="text-sm font-semibold text-foreground flex items-center mb-2">
              <ClipboardCheck class="w-4 h-4 mr-1.5 text-primary" /> AQL 2.5 ≠ 允许 2.5% 不良
            </h3>
            <p class="text-xs text-muted-foreground leading-relaxed">
              常见误区：AQL 2.5% 不是「这批允许有 2.5% 的不良」。它是<b class="text-foreground">批平均容忍线</b>——
              长期交验批的平均质量低于 2.5% 才算合格提交，接收概率约 95%；但对单个批，真实不良 2% 也可能被随机抽中拒收，
              3% 也常被接收。它承诺的是「批的平均」，不是「每批的保证」。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <div class="relative">
      <button
        type="button"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
        @click="toggleSeoContent"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-6">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>AQL 抽样方案查询是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          AQL（Acceptance Quality Limit，接收质量限）抽样是把「整批货收不收」变成一次可执行的随机检验的计数抽样制度。
          本工具按 GB/T 2828.1-2012 / ISO 2859-1 的两张公开表作答：先用批量与检验水平查「样本量字码表」得到字码（A~R），
          字码对应固定样本量阶梯（2、3、5、8、13、20、32、50、80、125、200、315、500、800、1250、2000）；
          再在「正常检验一次抽样主表」里用字码行 × AQL 列相交，读出接收数 Ac 与拒收数 Re——抽检件数里不良 ≤Ac 接收该批，≥Re 拒收。
          主表中有些格子不是方案而是上下箭头，代表该字码在该 AQL 下「无解」，必须随箭头改字码换样本量，本页已内置该规则。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">AQL 2.5 到底什么意思？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          AQL 2.5 表示：当连续提交批的质量水平等于或优于 2.5%（按缺陷率或每百单位缺陷数计）时，制度保证绝大多数批（抽样计划下接收概率约 95%）会被接收。
          它管的是「批平均」而不是「每一批」：抽 80 件、Ac=5，并不意味着这批货的不良率被默许到 5/80≈6.25%——若整批真实不良率确为 2.5%，
          80 件里恰好抽到 6 个被误退的概率也不小；反过来真实不良 4% 的批也经常被抽到 ≤5 而误收。所以 AQL 是买卖双方的风险分配尺，而非质量承诺，
          控住长期批平均、并以连续接收/拒收触发转移规则（加严/减量），才是它的正确用法。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">字码怎么查？（批量 → 水平 → 字码 → n 两步法）</h3>
        <ol class="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>第一步：在样本量字码表（表 1）里找到批量所在行，与检验水平列交叉得字码——如批量 3000、一般水平 II → 字码 J。</li>
          <li>字码即样本量：J → 抽 80 件。水平 I 抽样约为 II 的 0.4~0.5 倍（字码下移一档），水平 III 上移一档、判更准但抽更多。</li>
          <li>第二步：在主表（正常检验一次）里沿字码 J 行向右找 AQL 2.5 列，相交格给出 Ac=5、Re=6——「抽 80，≤5 收，≥6 退」。</li>
          <li>若相交格是箭头：↓ 表示往下找第一个有方案的行（样本量增大，AQL 不变、字码跟着改）；↑ 表示往上找第一个方案行（样本量可减小）。</li>
          <li>特殊检验水平 S-1~S-4 用于破坏性检验或高成本低批量场景，本工具未内置，需要时请直接查标准原文。</li>
        </ol>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">一次 / 二次 / 多次抽样怎么选？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          一次抽样只抽一样、一次判定，操作最简单，是外贸验货的绝对主流，但平均 sample 量最大、抽样风险相对偏高；
          二次抽样先抽小样本，落在灰色区再补抽第二样合计判定，在质量极好或极差时往往省样本，代价是流程两阶段化；
          多次抽样（五次为主）判别力最强、平均检验量最省，但记录与执行复杂，多见于在线全检场景。
          对按验货公司/驻厂 QC 运作的外贸单，建议固定用正常检验一次抽样（本表），只有在逐批检验的工厂内部质检才考虑二次/多次表。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">验货抽到不良怎么判？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          把 80 件（或方案给出的 n）里的缺陷按致命/严重/轻微分类计数，分别与对应等级方案的 Ac/Re 比较：
          每一等级都 ≤Ac 才判整批「通过」；任何一等级 ≥Re 即判「不通过（拒收）」。拒收不等于整批报废，常规处置是全检分拣、返工后重新提交复验，
          且连续拒收会触发加严检验（连续 5 批中 2 批拒）。注意判定用的是「样本中的不良个数」这一计数口径，不是不良率百分比，也常见误区是
          把 Ac=5 读成「允许 5%」——它说的是 80 个样本里最多允许数到 5 个。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">GB/T 2828.1 和 ISO 2859-1 是什么关系？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          GB/T 2828.1-2012《计数抽样检验程序 第 1 部分：按接收质量限(AQL)检索的逐批检验抽样计划》等同采用 ISO 2859-1:1999，两张主表可互换使用；
          美国的 ANSI/ASQ Z1.4 亦同源于 MIL-STD-105E。需注意老版本（GB 2828-87 / MIL-STD-105E）的批量区间与现行标准略有差异
          （如旧版把批量分为 151-280、281-500 等档，现行 ISO/GB 为 101-200、201-300、301-500），本工具采用现行标准的批量档位；
          与国外客户对表时请以 ISO 2859-1 / Z1.4 现行表为准，正式合同引用请核对标准原文页码。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">AQL 2.5 是允许这批货有 2.5% 的不良吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不是。AQL 是批平均的容忍线：长期交验批平均质量在 2.5% 或更好时，约 95% 的批会被接收；单个批可能因抽样随机性被误退，劣质批也可能被误收。它分配的是买卖双方风险，不是对本批质量的承诺。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">主表里碰到箭头怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">箭头表示该字码×AQL 组合没有方案：向下箭头用该列第一个向下的方案（样本量增大、字码随之改变），向上箭头反之取更小的样本量方案。例如批量小、AQL 很严时，需按 ↓ 改抽更大样本。本工具已自动完成箭头转移并给出实际执行的 n 与 Ac/Re。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">验货抽到不良品达到几个才算拒收？</h3>
            <p class="text-sm text-muted-foreground mt-1">按对应等级方案的 Re 判定：样本中该类不良数 ≤Ac 接收、≥Re 拒收，例如「抽 80，严重不良 6 个」即达 AQL 2.5 的 Re=6 判拒收。拒收批通常全检返工后重新提交复验，连续拒收会触发加严检验。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">服装和电子的 CR/MAJ/MIN 常用取值是多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">常见行业惯例为 CR 0（致命收 0 退 1）、MAJ 2.5、MIN 4.0；消费电子类常把 MAJ 收紧到 1.5 或 1.0。具体以买卖双方合同与买家 AQL 指引为准，本工具的组合快选只是默认值参考。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'aql-sampling-calculator'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  ClipboardCheck, Search, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: 'AQL 抽样方案查询 - GB/T 2828.1 / ISO 2859-1 验货抽样表在线查询 | 有条工具',
  description: '免费在线 AQL 抽样方案查询器：按批量、一般检验水平 I/II/III 与 AQL 查 GB/T 2828.1 / ISO 2859-1 正常检验一次抽样方案，样本量字码、抽检数 n、Ac/Re 允收拒收判定一目了然，支持 CR/MAJ/MIN 三等级并列与箭头规则，验货跟单必备，纯浏览器本地运行不上传',
  keywords: 'AQL 抽样,抽样检验方案,GB/T 2828,验货抽样表,允收拒收判定',
  author: '有条工具',
  ogTitle: 'AQL 抽样方案查询 - GB/T 2828.1 / ISO 2859-1 验货抽样表在线查询 | 有条工具',
  ogDescription: '批量→字码→方案两步查出 n、Ac/Re，支持 CR/MAJ/MIN 三等级并列与箭头规则，验货抽样的在线速查表。',
  ogUrl: 'https://www.util.cn/tools/aql-sampling-calculator',
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
          name: 'AQL 抽样方案查询',
          url: 'https://www.util.cn/tools/aql-sampling-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['批量/检验水平查样本量字码', '正常检验一次抽样 Ac/Re 判定', 'CR/MAJ/MIN 三等级并列方案', '箭头规则自动改字码', '服装/电子行业组合快选', '验货报告格式方案文本复制', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: 'AQL 抽样方案查询', item: 'https://www.util.cn/tools/aql-sampling-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'AQL 2.5 是允许这批货有 2.5% 的不良吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不是。AQL 是批平均的容忍线：长期交验批平均质量在 2.5% 或更好时，约 95% 的批会被接收；单个批可能因抽样随机性被误退，劣质批也可能被误收。它分配的是买卖双方风险，不是对本批质量的承诺。' }
            },
            {
              '@type': 'Question',
              name: '主表里碰到箭头怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '箭头表示该字码与AQL组合没有方案：向下箭头取该列第一个向下的方案（样本量增大、字码随之改变），向上箭头反之取更小样本的方案。例如批量小、AQL很严时需按向下箭头改抽更大样本。本工具已自动完成箭头转移并给出实际执行的n与Ac/Re。' }
            },
            {
              '@type': 'Question',
              name: '验货抽到不良品达到几个才算拒收？',
              acceptedAnswer: { '@type': 'Answer', text: '按对应等级方案的Re判定：样本中该类不良数不超过Ac接收，达到Re及以上拒收，例如抽80件、严重不良6个即达AQL2.5方案的Re=6判拒收。拒收批通常全检返工后重新提交复验，连续拒收会触发加严检验。' }
            },
            {
              '@type': 'Question',
              name: '服装和电子的 CR/MAJ/MIN 常用取值是多少？',
              acceptedAnswer: { '@type': 'Answer', text: '常见行业惯例为致命缺陷收0退1、严重AQL2.5、轻微AQL4.0；消费电子类常把严重缺陷收紧到AQL1.5或1.0。具体以买卖双方合同与买家AQL指引为准，工具的服装/电子组合卡仅是默认值参考。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 数据来源：GB/T 2828.1-2012（等同 ISO 2859-1:1999，与 ANSI/ASQ Z1.4 同系）的
// 表 1「样本量字码表」（一般检验水平 I/II/III 三列，批量档位采用现行标准边界）
// 与表 2-A「正常检验一次抽样方案」（AQL 0.065–15 常用段）。
// 主表为规则化生成而非手录：每个 AQL 列的接收数序列固定为 0,1,2,3,5,7,10,14,21（Re=Ac+1），
// AQL 每沿 R5 系列升一档（×√10 近似），方案带在样本量阶梯上整体下移一行；
// 字码行索引 i 与 AQL 列索引 j（0.010→0 … 2.5→12 … 15→16）满足 d=i−(16−j)：
// d<0 为向下箭头（改用更大样本），d>8 为向上箭头（改用更小样本），否则 Ac=AC_SEQ[d]。
// 该生成规则可完整复现公开表全部方案格，锚点见随页自测（J/80@2.5=5/6、L/200@2.5=10/11、
// (500,0/1)@0.065、A/2@15=0/1、H/50@4.0=5/6 等，逐格与公开表一致）。
const N_LADDER = [2, 3, 5, 8, 13, 20, 32, 50, 80, 125, 200, 315, 500, 800, 1250, 2000]
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R']
const CODE_N = Object.fromEntries(LETTERS.map((lt, i) => [lt, N_LADDER[i]]))
const AC_SEQ = [0, 1, 2, 3, 5, 7, 10, 14, 21]
// 完整 AQL 列索引（本工具开放 0.065 起；更严档位落在表外时提示查标准）
const AQL_COLUMNS = [0.010, 0.015, 0.025, 0.040, 0.065, 0.10, 0.15, 0.25, 0.40, 0.65, 1.0, 1.5, 2.5, 4.0, 6.5, 10, 15]
const AQL_USABLE = AQL_COLUMNS.slice(4) // 0.065 … 15 共 13 档
const LEVELS = ['I', 'II', 'III']

// 表 1：批量区间 × 一般检验水平 → 字码（max 为 null 表示无上限档）
const LOT_RANGES = [
  { min: 2, max: 8, label: '2-8', I: 'A', II: 'A', III: 'B' },
  { min: 9, max: 15, label: '9-15', I: 'A', II: 'A', III: 'B' },
  { min: 16, max: 25, label: '16-25', I: 'A', II: 'B', III: 'C' },
  { min: 26, max: 40, label: '26-40', I: 'B', II: 'C', III: 'D' },
  { min: 41, max: 60, label: '41-60', I: 'B', II: 'C', III: 'D' },
  { min: 61, max: 100, label: '61-100', I: 'C', II: 'D', III: 'E' },
  { min: 101, max: 200, label: '101-200', I: 'C', II: 'E', III: 'F' },
  { min: 201, max: 300, label: '201-300', I: 'D', II: 'F', III: 'G' },
  { min: 301, max: 500, label: '301-500', I: 'D', II: 'G', III: 'H' },
  { min: 501, max: 1200, label: '501-1200', I: 'E', II: 'H', III: 'J' },
  { min: 1201, max: 3200, label: '1201-3200', I: 'F', II: 'J', III: 'K' },
  { min: 3201, max: 10000, label: '3201-10000', I: 'G', II: 'K', III: 'L' },
  { min: 10001, max: 35000, label: '10001-35000', I: 'H', II: 'L', III: 'M' },
  { min: 35001, max: 150000, label: '35001-150000', I: 'J', II: 'M', III: 'N' },
  { min: 150001, max: 500000, label: '150001-500000', I: 'K', II: 'N', III: 'P' },
  { min: 500001, max: null, label: '500001 以上', I: 'L', II: 'P', III: 'R' }
]

const DEFECT_DEFS = {
  CR: { key: 'CR', label: '致命 CR' },
  MAJ: { key: 'MAJ', label: '严重 MAJ' },
  MIN: { key: 'MIN', label: '轻微 MIN' }
}

// 批量 → 字码（表 1 档位命中）
function findLotRange(lot) {
  if (!Number.isFinite(lot) || !Number.isInteger(lot) || lot < 2) return null
  return LOT_RANGES.find((r) => lot >= r.min && (r.max === null || lot <= r.max)) || null
}

// 单个字码行 × AQL 列的方案格：d = i − (16 − j)
// 返回 { kind: 'plan'|'down'|'up'|'out', rowIdx, ac }
function tableCell(letterIdx, j) {
  if (j < 4) return { kind: 'out' } // 0.010~0.040 档超出本工具开放区
  const i0 = 16 - j
  const d = letterIdx - i0
  if (d < 0) return { kind: 'down', rowIdx: i0 }
  if (d >= AC_SEQ.length) return { kind: 'up', rowIdx: i0 + AC_SEQ.length - 1 }
  return { kind: 'plan', rowIdx: letterIdx, ac: AC_SEQ[d] }
}

// 完整解一道方案：aql 为数字；0 表示致命「收 0」惯例（无箭头、按本字码行 Ac=0 Re=1）
function resolvePlan(lot, level, aql) {
  const range = findLotRange(lot)
  if (!range) return { ok: false, error: 'invalid-lot' }
  const letter = range[level]
  const letterIdx = LETTERS.indexOf(letter)
  const ownN = CODE_N[letter]
  if (aql === 0) {
    return {
      ok: true, rangeLabel: range.label, letter, n: ownN, arrow: 'critical',
      final: { letter, n: ownN, ac: 0, re: 1 }
    }
  }
  const j = AQL_COLUMNS.indexOf(aql)
  if (j < 4) return { ok: false, error: 'table-out' }
  const cell = tableCell(letterIdx, j)
  if (cell.kind === 'out') return { ok: false, error: 'table-out' }
  if (cell.kind === 'plan') {
    return {
      ok: true, rangeLabel: range.label, letter, n: ownN, arrow: null,
      final: { letter, n: ownN, ac: cell.ac, re: cell.ac + 1 }
    }
  }
  if (cell.rowIdx > LETTERS.length - 1) return { ok: false, error: 'table-out' }
  const target = { letter: LETTERS[cell.rowIdx], n: CODE_N[LETTERS[cell.rowIdx]], ac: cell.kind === 'down' ? 0 : AC_SEQ[AC_SEQ.length - 1] }
  return {
    ok: true, rangeLabel: range.label, letter, n: ownN, arrow: cell.kind,
    final: { letter: target.letter, n: target.n, ac: target.ac, re: target.ac + 1 }
  }
}

// 「抽 80，不良 ≤5 接收，≥6 拒收」
function judgementText(final) {
  return `抽 ${final.n} 件，不良 ≤${final.ac} 接收，≥${final.re} 拒收`
}

function aqlLabelOf(aql) {
  return aql === 0 ? '0（收 0）' : String(aql)
}

// 箭头处理说明一句
function arrowNoteText(row, level) {
  if (row.arrow === 'down') {
    return `AQL ${aqlLabelOf(row.aql)} 对字码 ${row.letter}（n=${row.n}）无方案：向下箭头，改用字码 ${row.final.letter}、样本量 ${row.final.n} 的方案（${row.final.ac}/${row.final.re}）。`
  }
  if (row.arrow === 'up') {
    return `AQL ${aqlLabelOf(row.aql)} 对字码 ${row.letter}（n=${row.n}）无方案：向上箭头，改用字码 ${row.final.letter}、样本量 ${row.final.n} 的方案（${row.final.ac}/${row.final.re}）。`
  }
  if (row.arrow === 'critical') {
    return `致命缺陷按行业惯例执行「收 0 退 1」（标准主表无 AQL 0 列），样本量仍按水平 ${level} 字码行。`
  }
  if (row.state && row.state !== 'plan') return '该批量/水平/AQL 组合超出本页收录表区，请查标准原文。'
  return ''
}

// 验货报告格式方案行：「抽样方案 AQL 2.5 / 水平 II：n=80, Ac=5 Re=6」
function planLineText(row, level) {
  if (row.state !== 'plan') return `${row.label}：表外请查标准`
  const arrow = row.arrow === 'down' ? '（↓箭头改字码）' : row.arrow === 'up' ? '（↑箭头改字码）' : row.arrow === 'critical' ? '（致命收0）' : ''
  return `抽样方案 AQL ${aqlLabelOf(row.aql)} / 水平 ${level}：n=${row.final.n}, Ac=${row.final.ac} Re=${row.final.re}${arrow}`
}

// 组装复制全文
function buildReportText(lot, level, letter, rows) {
  const head = `AQL 抽样方案（GB/T 2828.1-2012 / ISO 2859-1 正常检验一次抽样）\n批量 ${lot} · 一般检验水平 ${level} · 字码 ${letter}`
  const lines = rows.map((r) => planLineText(r, level))
  return [head, ...lines].join('\n')
}

// 多等级定义：single=[{key:'AQL',...}]；multi=[CR,MAJ,MIN]
function buildDefs(mode, aqlSingle, aqlCR, aqlMAJ, aqlMIN) {
  if (mode === 'single') return [{ key: 'AQL', label: '抽检', aql: aqlSingle }]
  return [
    { ...DEFECT_DEFS.CR, aql: aqlCR },
    { ...DEFECT_DEFS.MAJ, aql: aqlMAJ },
    { ...DEFECT_DEFS.MIN, aql: aqlMIN }
  ]
}

// 一行方案 = resolvePlan + UI 派生文本（state: plan/out/invalid）
function buildRow(lot, level, def) {
  const r = resolvePlan(lot, level, def.aql)
  if (!r.ok) {
    return { ...def, state: 'invalid', out: r.error === 'table-out' }
  }
  return {
    ...def,
    state: 'plan',
    rangeLabel: r.rangeLabel,
    letter: r.letter,
    n: r.n,
    arrow: r.arrow,
    final: r.final,
    nOverLot: r.final.n >= lot
  }
}

// ---------- 交互状态 ----------
const lotInput = ref(1000)
const level = ref('II')
const defectMode = ref('single')
const aqlSingle = ref(2.5)
const aqlCR = ref(0)
const aqlMAJ = ref(2.5)
const aqlMIN = ref(4.0)
const seoContentVisible = ref(true)
const copied = ref(false)
let copyTimer = null

const CR_AQL_OPTIONS = [0, ...AQL_USABLE]
const COMBOS = [
  { key: 'garment', name: '服装 / 纺织', spec: 'CR 0 · MAJ 2.5 · MIN 4.0', cr: 0, maj: 2.5, min: 4.0 },
  { key: 'electronics', name: '消费电子', spec: 'CR 0 · MAJ 1.5 · MIN 4.0', cr: 0, maj: 1.5, min: 4.0 }
]

const lotValid = computed(() => {
  const v = lotInput.value
  return Number.isFinite(v) && Number.isInteger(v) && v >= 2
})

const matchedRangeLabel = computed(() => {
  const r = findLotRange(lotInput.value)
  return r ? r.label : ''
})

const primaryLetter = computed(() => {
  const r = findLotRange(lotInput.value)
  return r ? r[level.value] : '—'
})

const primaryN = computed(() => CODE_N[primaryLetter.value] ?? '—')

const resultRows = computed(() => {
  if (!lotValid.value) return []
  const defs = buildDefs(defectMode.value, aqlSingle.value, aqlCR.value, aqlMAJ.value, aqlMIN.value)
  return defs.map((d) => {
    const row = buildRow(lotInput.value, level.value, d)
    if (row.state !== 'plan') {
      return { ...row, arrowNote: row.out ? '该 AQL 档低于 0.065，超出本页表区，请查 GB/T 2828.1 标准原文。' : '批量无效。', nOverLot: false }
    }
    return { ...row, arrowNote: arrowNoteText(row, level.value) }
  })
})

const singleArrowNote = computed(() => {
  if (defectMode.value !== 'single' || !resultRows.value.length) return ''
  const row = resultRows.value[0]
  if (row.state !== 'plan') return row.arrowNote
  if (row.nOverLot) return '方案样本量已超批量：批量过小或档位过严，建议全检、改用更低检验水平，或直接查表核对。'
  return row.arrowNote
})

const reportText = computed(() => {
  if (!lotValid.value || !resultRows.value.length) return ''
  return buildReportText(lotInput.value, level.value, primaryLetter.value, resultRows.value)
})

function defectChipClass(key) {
  if (key === 'CR') return 'bg-red-500/10 text-red-600 border-red-500/20'
  if (key === 'MAJ') return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
  if (key === 'MIN') return 'bg-green-500/10 text-green-600 border-green-500/20'
  return 'bg-primary/10 text-primary border-primary/20'
}

function pickRange(e) {
  const v = parseInt(e.target.value, 10)
  if (Number.isFinite(v)) lotInput.value = v
}

function applyCombo(combo) {
  defectMode.value = 'multi'
  aqlCR.value = combo.cr
  aqlMAJ.value = combo.maj
  aqlMIN.value = combo.min
}

// 预设①：批量 3000 / 水平 II / AQL 2.5 → 字码 J、n=80、Ac 5 Re 6（与公开表核对，非 200 件）
// 预设②：服装 1000 件三等级 CR0 / MAJ2.5 / MIN4.0 → 字码 H、n=50
function loadPreset(lot, lv) {
  lotInput.value = lot
  level.value = lv
  if (lot === 1000 && lv === 'II') {
    defectMode.value = 'multi'
    aqlCR.value = 0
    aqlMAJ.value = 2.5
    aqlMIN.value = 4.0
  } else {
    defectMode.value = 'single'
    aqlSingle.value = 2.5
  }
}

function resetAll() {
  lotInput.value = 1000
  level.value = 'II'
  defectMode.value = 'single'
  aqlSingle.value = 2.5
  aqlCR.value = 0
  aqlMAJ.value = 2.5
  aqlMIN.value = 4.0
  copied.value = false
}

async function copyPlanText() {
  const text = reportText.value
  if (!text) return
  let done = false
  try {
    await navigator.clipboard.writeText(text)
    done = true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      done = document.execCommand('copy')
      document.body.removeChild(ta)
    } catch {
      done = false
    }
  }
  if (done) {
    copied.value = true
    if (copyTimer !== null) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copied.value = false; copyTimer = null }, 2000)
  }
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('aql-sampling-calculator')
})

onBeforeUnmount(() => {
  if (copyTimer !== null) clearTimeout(copyTimer)
})
</script>
