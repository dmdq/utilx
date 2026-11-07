<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- A4 打印页边距 -->
    <component :is="'style'" v-html="printPageCss"></component>

    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <ShieldAlert class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">项目风险登记表</h1>
          <p class="text-sm text-muted-foreground mt-1">风险清单按可能性×影响 5×5 矩阵自动定级，暴露度汇总与 Top3 风险卡，登记表导出 CSV / Markdown 与 A4 打印</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线项目风险登记表生成工具：逐行登记风险描述、类别（技术 / 进度 / 成本 / 人员 / 外部 / 合规）、可能性 P(1-5)、影响 I(1-5)、缓解措施、负责人与状态，
        自动按「分数 = P×I」定级（≥15 高、8-12 中、≤6 低，通行口径）并渲染 5×5 风险矩阵——每格显示该级风险数，点击格子即可筛选清单；
        顶部实时汇总各等级暴露度与 Top3 风险卡。支持导出 CSV / Markdown（含矩阵快照）与 A4 表格打印，数据本地保存不上传。
      </p>
    </div>

    <!-- 页面说明条 -->
    <div class="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-6 no-print">
      <Info class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        定级口径：分数 = 可能性 P(1-5) × 影响 I(1-5)，<b class="text-foreground">≥15 为高（红）、8-12 为中（黄）、≤6 为低（绿）</b>，为项目管理通行默认阈值（PMP 定性风险分析常见分档），
        团队另有约定时可按同规则自行换算；1-5 相乘不可能得到 7/11/13/14，8 分（如 2×4）按中处理。本工具为定性风险评估的记录与排序辅助，不构成正式风险审计结论。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：登记编辑 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4 no-print">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <ShieldAlert class="w-5 h-5 mr-2 text-primary" /> 风险登记
          </h2>
          <button
            type="button"
            @click="addRisk"
            class="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-medium inline-flex items-center gap-1 transition"
          >
            <Plus class="w-3.5 h-3.5" /> 添加风险
          </button>
        </div>

        <div>
          <label for="risk-project" class="block text-xs text-muted-foreground mb-1">项目 / 事由名称</label>
          <input
            id="risk-project"
            v-model="project"
            type="text"
            maxlength="40"
            placeholder="如：新版官网改版项目"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <!-- 风险行 -->
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">风险清单（{{ risks.length }} 条）</p>
          <div
            v-for="(r, index) in risks"
            :key="r.id"
            class="rounded-lg border p-3 space-y-2"
            :class="r.desc.trim() ? 'bg-muted/30 border-border' : 'bg-red-500/5 border-red-500/50'"
          >
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono text-muted-foreground w-6 text-right">{{ index + 1 }}</span>
              <input
                v-model="r.desc"
                type="text"
                maxlength="60"
                placeholder="风险描述，如：核心接口性能不达标"
                class="flex-1 min-w-0 px-2 py-1.5 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                @click="removeRisk(r.id)"
                class="w-7 h-7 flex-shrink-0 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition"
                aria-label="删除该风险"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
            <div class="grid grid-cols-4 gap-1.5">
              <label class="block">
                <span class="block text-[10px] text-muted-foreground mb-1">类别</span>
                <select v-model="r.category" class="w-full px-1.5 py-1.5 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
                </select>
              </label>
              <label class="block">
                <span class="block text-[10px] text-muted-foreground mb-1">可能性 P</span>
                <select v-model.number="r.p" class="w-full px-1.5 py-1.5 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  <option v-for="n in 5" :key="'p' + n" :value="n">{{ n }}</option>
                </select>
              </label>
              <label class="block">
                <span class="block text-[10px] text-muted-foreground mb-1">影响 I</span>
                <select v-model.number="r.i" class="w-full px-1.5 py-1.5 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  <option v-for="n in 5" :key="'i' + n" :value="n">{{ n }}</option>
                </select>
              </label>
              <label class="block">
                <span class="block text-[10px] text-muted-foreground mb-1">状态</span>
                <select v-model="r.status" class="w-full px-1.5 py-1.5 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  <option v-for="s in STATUS" :key="s" :value="s">{{ s }}</option>
                </select>
              </label>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded-full border text-xs font-semibold flex-shrink-0" :class="levelChipClass(riskOf(r).level)">
                {{ LEVEL_META[riskOf(r).level].label }} {{ riskOf(r).score }}
              </span>
              <input
                v-model="r.mitigation"
                type="text"
                maxlength="60"
                placeholder="缓解措施，如：提前压测并加缓存"
                class="flex-1 min-w-0 px-2 py-1.5 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                v-model="r.owner"
                type="text"
                maxlength="16"
                placeholder="负责人"
                class="w-20 flex-shrink-0 px-2 py-1.5 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <p v-if="!risks.length" class="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 text-center border border-dashed border-border">
            暂无风险，点上方「添加风险」或右侧「载入示例」开始登记
          </p>
          <p v-if="emptyDescCount > 0" class="text-xs text-red-600 flex items-center gap-1">
            <TriangleAlert class="w-3.5 h-3.5" /> 有 {{ emptyDescCount }} 条风险描述为空，导出前请补全。
          </p>
        </div>

        <div class="pt-3 border-t border-border space-y-3">
          <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input v-model="excludeClosed" type="checkbox" class="h-4 w-4 accent-primary" />
            汇总与矩阵排除「已关闭」风险（默认全部计入台账）
          </label>
        </div>
      </div>

      <!-- 右：矩阵 + 汇总 + 清单 -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 暴露度汇总 -->
        <div class="bg-card border border-border rounded-lg p-6 print-area">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 class="text-lg font-semibold flex items-center">
              <Gauge class="w-5 h-5 mr-2 text-primary" /> 风险暴露度汇总
            </h2>
            <div class="flex flex-wrap items-center gap-2 no-print">
              <button
                type="button"
                @click="loadExample"
                class="px-3 py-1.5 text-xs rounded-lg border border-border bg-background hover:bg-muted text-foreground inline-flex items-center gap-1 transition"
              >
                <Play class="w-3.5 h-3.5" /> 载入示例
              </button>
              <button
                type="button"
                @click="clearAll"
                class="px-3 py-1.5 text-xs rounded-lg border border-border bg-background hover:bg-muted text-foreground inline-flex items-center gap-1 transition"
              >
                <RefreshCw class="w-3.5 h-3.5" /> 清空
              </button>
              <button
                type="button"
                @click="downloadCsv"
                class="px-3 py-1.5 text-xs rounded-lg border border-border bg-background hover:bg-muted text-foreground inline-flex items-center gap-1 transition"
              >
                <Download class="w-3.5 h-3.5" /> 下载 CSV
              </button>
              <button
                type="button"
                @click="copyMarkdown"
                class="px-3 py-1.5 text-xs rounded-lg border border-border bg-background hover:bg-muted text-foreground inline-flex items-center gap-1 transition"
              >
                <Copy class="w-3.5 h-3.5" /> 复制 Markdown
              </button>
              <button
                type="button"
                @click="printSheet"
                class="px-3 py-1.5 text-xs rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground inline-flex items-center gap-1 transition"
              >
                <Printer class="w-3.5 h-3.5" /> A4 打印
              </button>
            </div>
          </div>

          <!-- 等级计数 -->
          <div class="grid grid-cols-3 gap-3 mb-4">
            <div
              v-for="lv in ['high', 'mid', 'low']"
              :key="lv"
              class="rounded-xl p-4 text-center border"
              :class="levelCardClass(lv)"
            >
              <p class="text-xs mb-1">{{ LEVEL_META[lv].label }}风险</p>
              <p class="text-3xl font-bold leading-tight">{{ exposure[lv] }}</p>
              <p class="text-[10px] mt-1 opacity-80">{{ LEVEL_META[lv].rule }}</p>
            </div>
          </div>

          <!-- Top3 风险卡 -->
          <h3 class="text-sm font-semibold text-foreground mb-2">Top3 关注风险（按分数降序）</h3>
          <div v-if="top3.length" class="space-y-2 mb-4">
            <div
              v-for="(r, idx) in top3"
              :key="r.id"
              class="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border bg-muted/40 px-4 py-2.5"
            >
              <span class="text-sm font-bold text-primary w-5">{{ idx + 1 }}</span>
              <span class="px-2 py-0.5 rounded-full border text-xs font-semibold" :class="levelChipClass(riskOf(r).level)">
                {{ LEVEL_META[riskOf(r).level].label }} {{ riskOf(r).score }}
              </span>
              <span class="text-sm text-foreground font-medium flex-1 min-w-[140px]">{{ r.desc || '（未填描述）' }}</span>
              <span class="text-xs text-muted-foreground">P{{ riskOf(r).p }} × I{{ riskOf(r).i }} · {{ r.category }}</span>
              <span v-if="r.owner" class="text-xs text-muted-foreground">负责人 {{ r.owner }}</span>
              <span class="text-xs px-1.5 py-0.5 rounded bg-muted border border-border" :class="r.status === '已关闭' ? 'text-muted-foreground line-through' : 'text-foreground'">{{ r.status }}</span>
            </div>
          </div>
          <p v-else class="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 text-center mb-4">暂无风险登记，左侧添加或载入示例后此处按分数排出最需关注的三条。</p>

          <!-- 5×5 矩阵 -->
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold text-foreground">5×5 风险矩阵（行=可能性 P，列=影响 I；点格子筛选清单）</h3>
            <button
              v-if="cellFilter"
              type="button"
              @click="cellFilter = null"
              class="no-print px-2 py-1 text-xs rounded-md border border-border bg-background hover:bg-muted text-muted-foreground"
            >
              取消筛选（P{{ cellFilter.p }}×I{{ cellFilter.i }}）
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="border-collapse min-w-[420px]">
              <thead>
                <tr>
                  <th class="w-16"></th>
                  <th v-for="n in 5" :key="'h' + n" class="px-2 py-1 text-xs font-medium text-muted-foreground">I={{ n }} <span class="block text-[10px] font-normal">{{ IMPACT_HINTS[n - 1] }}</span></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in pRows" :key="'r' + p">
                  <th class="px-2 py-1 text-xs font-medium text-muted-foreground text-right">P={{ p }}<span class="block text-[10px] font-normal">{{ PROB_HINTS[p - 1] }}</span></th>
                  <td
                    v-for="n in 5"
                    :key="'c' + p + '-' + n"
                    class="border border-border text-center cursor-pointer transition select-none"
                    :class="cellClass(p, n)"
                    :title="'P' + p + '×I' + n + ' = ' + (p * n) + ' → ' + LEVEL_META[levelOfScore(p * n)].label + '风险'"
                    @click="toggleCellFilter(p, n)"
                  >
                    <span class="block py-2.5 text-sm font-bold">{{ matrix[p - 1][n - 1] }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground no-print">
            <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm inline-block" :class="levelCellClass('high')"></span> 高 ≥15</span>
            <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm inline-block" :class="levelCellClass('mid')"></span> 中 8-12</span>
            <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm inline-block" :class="levelCellClass('low')"></span> 低 ≤6</span>
            <span>格内数字 = 落在该格的风险条数（{{ excludeClosed ? '已排除已关闭' : '含已关闭' }}）</span>
          </div>
        </div>

        <!-- 风险清单（矩阵点击筛选） -->
        <div class="bg-card border border-border rounded-lg p-6 no-print">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <ListFilter class="w-5 h-5 mr-2 text-primary" />
            风险清单
            <span class="text-sm font-normal text-muted-foreground ml-2">{{ cellFilter ? `筛选：P${cellFilter.p}×I${cellFilter.i}` : '全部' }}（{{ filteredRisks.length }} 条）</span>
          </h2>
          <div class="space-y-2">
            <div
              v-for="(row, idx) in filteredRisks"
              :key="row.r.id"
              class="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border bg-muted/40 px-4 py-2.5"
            >
              <span class="text-xs font-mono text-muted-foreground">{{ idx + 1 }}</span>
              <span class="px-2 py-0.5 rounded-full border text-xs font-semibold" :class="levelChipClass(row.level)">{{ LEVEL_META[row.level].label }} {{ row.score }}</span>
              <span class="text-sm text-foreground flex-1 min-w-[160px]" :class="row.r.status === '已关闭' ? 'line-through text-muted-foreground' : ''">{{ row.r.desc || '（未填描述）' }}</span>
              <span class="text-xs text-muted-foreground">{{ row.r.category }}</span>
              <span class="text-xs text-muted-foreground">P{{ row.p }}×I{{ row.i }}</span>
              <span v-if="row.r.owner" class="text-xs text-muted-foreground">{{ row.r.owner }}</span>
              <span v-if="row.r.mitigation" class="text-xs text-muted-foreground basis-full pl-1">缓解：{{ row.r.mitigation }}</span>
            </div>
            <p v-if="!filteredRisks.length" class="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 text-center">
              {{ cellFilter ? '该矩阵格暂无风险，点击「取消筛选」查看全部。' : '暂无风险登记。' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- A4 打印版式（仅打印时显示） -->
    <div class="print-sheet">
      <p class="ps-title">项目风险登记表{{ project ? ' · ' + project : '' }}</p>
      <p class="ps-meta">
        登记 {{ todayText }} ｜ 共 {{ risks.length }} 条：高 {{ exposure.high }} / 中 {{ exposure.mid }} / 低 {{ exposure.low }}
        ｜ 定级口径：P×I，≥15 高、8-12 中、≤6 低（{{ excludeClosed ? '不含已关闭' : '含已关闭' }}）
      </p>
      <p class="ps-sec">5×5 风险矩阵快照（行=可能性 P，列=影响 I，格内为风险条数）</p>
      <table class="ps-table ps-matrix">
        <thead>
          <tr>
            <th class="w-p">P \ I</th>
            <th v-for="n in 5" :key="'mh' + n">I={{ n }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in pRows" :key="'mr' + p">
            <th class="w-p">P={{ p }}</th>
            <td v-for="n in 5" :key="'mc' + p + '-' + n" :class="'lv-' + levelOfScore(p * n)">{{ matrix[p - 1][n - 1] }}</td>
          </tr>
        </tbody>
      </table>
      <p class="ps-sec">风险清单（按分数降序）</p>
      <table class="ps-table">
        <thead>
          <tr>
            <th class="w-no">序号</th>
            <th class="w-desc">风险描述</th>
            <th class="w-cat">类别</th>
            <th class="w-pi">P</th>
            <th class="w-pi">I</th>
            <th class="w-pi">分数</th>
            <th class="w-lv">等级</th>
            <th class="w-mit">缓解措施</th>
            <th class="w-owner">负责人</th>
            <th class="w-st">状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in sortedRows" :key="'pr' + row.r.id">
            <td>{{ row.no }}</td>
            <td>{{ row.r.desc }}</td>
            <td>{{ row.r.category }}</td>
            <td>{{ row.p }}</td>
            <td>{{ row.i }}</td>
            <td>{{ row.score }}</td>
            <td>{{ LEVEL_META[row.level].label }}</td>
            <td>{{ row.r.mitigation }}</td>
            <td>{{ row.r.owner }}</td>
            <td>{{ row.r.status }}</td>
          </tr>
          <tr v-if="!sortedRows.length">
            <td colspan="10" style="text-align:center;color:#9ca3af;">（暂无风险登记）</td>
          </tr>
        </tbody>
      </table>
      <p class="ps-sign">
        评估人：________________　　审核人：________________　　日期：____________
      </p>
      <p class="ps-foot">
        说明：定级为定性风险评估口径（可能性 1-5 × 影响 1-5，≥15 高、8-12 中、≤6 低），阈值为通行默认，可按团队约定调整；
        高风险须指定负责人与缓解时限并纳入例会跟踪，中风险定期复核，低风险观察即可。本表为管理辅助工具，不替代正式风险审计。
      </p>
    </div>

    <!-- SEO 内容区（details/summary 折叠） -->
    <details class="no-print group bg-card border border-border rounded-lg mb-12">
      <summary class="cursor-pointer select-none px-6 py-4 text-lg font-semibold text-foreground flex items-center justify-between">
        <span><span class="text-primary mr-2">#</span>风险登记表应该怎么写？定性和定量评估有什么区别？</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div class="px-6 pb-6">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>PMP 风险登记表的要素</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          风险登记表（Risk Register）是 PMBOK 里「识别风险」过程的主要输出，是一份贯穿项目全周期的动态台账：
          项目启动时建档，每个风险从识别到关闭全程留痕。一份够用的风险登记表通常包含以下要素——
        </p>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground mb-4">
          <li><b class="text-foreground">风险描述</b>：推荐「风险描述 + 不确定性 + 后果」三段式，如「因核心接口性能不达标，可能导致大促期间页面超时」。</li>
          <li><b class="text-foreground">类别</b>：技术、进度、成本、人员、外部、合规等，便于分口管理与责任归位。</li>
          <li><b class="text-foreground">可能性 P 与影响 I</b>：定性打分 1-5，两者相乘得风险分数，决定优先级。</li>
          <li><b class="text-foreground">等级</b>：按阈值把分数分为高 / 中 / 低（本页默认 ≥15 高、8-12 中、≤6 低），高风险必须指定应对策略。</li>
          <li><b class="text-foreground">缓解措施与负责人</b>：每条高风险都要有明确的应对动作、责任人与时限，写「持续关注」等于没写。</li>
          <li><b class="text-foreground">状态</b>：开放 → 缓解中 → 已关闭，关闭时建议补一句实际结果，沉淀为组织过程资产。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">定性 vs 定量风险评估</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          本页用的是<b class="text-foreground">定性评估</b>：用 1-5 的序数标度给可能性和影响打分，快速、低成本，适合绝大多数项目日常管理；
          缺点是分数是相对的（P4×I4 与 P5×I3 同为 16 分，但含义并不严格等价），且打分带主观性。
          <b class="text-foreground">定量评估</b>则把可能性换算成概率、把影响换算成金额或工期（EMV 期望货币值、决策树、蒙特卡洛模拟），
          输出的是可加总比较的数字，适合高投入、投标决策或合同违约风险等重大场景。通行做法是先用定性矩阵筛出高风险项，只对少数关键风险做定量分析——不要一上来就全量蒙特卡洛。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">矩阵怎么用才有效？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          矩阵的价值在「对齐口径」而不是「算数」：让团队对「5 分可能性」「4 分影响」的判据达成一致（如影响 4 分=单项目延期一周以上或损失 10 万元以上），
          再把每条风险落到格子里。落图之后看两件事：一是右上角（高可能性 × 高影响）格子有没有堆积——那是要立刻升级资源化解的；
          二是分数相同的风险怎么排序——影响更接近「不可接受线」的优先处理。本页点击矩阵格即可筛出该格风险清单，例会上逐条过最方便。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">登记表之外还需要什么？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          登记表解决「记什么」，落实还要靠节奏：高风险项进例会跟踪、责任人每周更新状态；状态长期不变的「僵尸风险」要么重新评估要么关闭；
          项目复盘时把已关闭风险的实际发生情况回填，逐步形成团队自己的风险检查单。
          需要把风险应对落到具体行动时，可配合站内<a href="/tools/decision-framework-cards/" class="text-primary underline">决策执行框架卡</a>（5W2H / PDCA / 四象限）把缓解措施拆成可执行项。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么 9-12 分是中，8 分也算中？</h3>
            <p class="text-sm text-muted-foreground mt-1">可能性与影响都是 1-5 的整数，相乘只可能得到 1、2、3、4、5、6、8、9、10、12、15、16、20、25 这 14 个数——7、11、13、14 根本取不到。所以通行口径的分档是 ≤6 低、8-12 中、≥15 高，8 分（2×4 或 4×2）落在中档下沿。若你们团队用连续分数或自定义阈值，按同样规则换算即可。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">可能性 4 和影响 4，到底先处理哪个？</h3>
            <p class="text-sm text-muted-foreground mt-1">分数相同时看「影响不可接受线」：影响分更高（后果更重）的优先——低概率但致命的风险通常值得提前布防，高概率但影响轻微的更多靠流程兜底。这也是矩阵把影响放横轴、可能性放纵轴的原因：右上角永远最优先。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">已关闭的风险要从矩阵里去掉吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">台账建议保留（审计与复盘需要），但当前暴露度看的是「还开着的风险」。本页默认全部计入并标注口径，勾选「排除已关闭」后矩阵与汇总会即时切换，两种口径随时对照。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">导出的 CSV 打开是乱码怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">本工具导出的 CSV 已带 UTF-8 BOM，用 Excel / WPS 直接双击打开即可正常显示中文；如果用文本编辑器打开看到乱码，请把编码切到 UTF-8。</p>
          </div>
        </div>
      </div>
    </details>

    <div class="no-print">
      <RelatedTools :currentToolId="'risk-register-generator'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  ShieldAlert, Plus, X, Copy, Download, Printer, RefreshCw, Play,
  Info, ChevronDown, TriangleAlert, Gauge, ListFilter
} from 'lucide-vue-next'
import { useSeoMeta, useHead } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '项目风险登记表 - 5×5 风险矩阵自动定级 | 在线风险台账工具',
  description: '免费在线项目风险登记表生成器：逐行登记风险描述/类别/可能性/影响/缓解措施/负责人/状态，按 P×I 自动定级（≥15高、8-12中、≤6低），5×5 风险矩阵可视化点击筛选，暴露度汇总与 Top3 风险卡，导出 CSV/Markdown（含矩阵快照）与 A4 打印，纯本地运行不上传',
  keywords: '风险登记表,风险矩阵,风险管理,PMP,风险评估表,风险等级划分,项目风险管理',
  author: '有条工具',
  ogTitle: '项目风险登记表 - 5×5 风险矩阵自动定级 | 有条工具',
  ogDescription: '风险清单按可能性×影响自动定级，5×5 矩阵点击筛选，暴露度汇总与 Top3 风险卡，CSV/Markdown 导出与 A4 打印。',
  ogUrl: 'https://www.util.cn/tools/risk-register-generator',
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
          name: '项目风险登记表',
          url: 'https://www.util.cn/tools/risk-register-generator',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '风险行编辑：描述/类别/P/I/缓解措施/负责人/状态',
            'P×I 自动定级（≥15 高、8-12 中、≤6 低）',
            '5×5 风险矩阵可视化与点击筛选',
            '暴露度汇总与 Top3 风险卡',
            'CSV / Markdown 导出（含矩阵快照）',
            'A4 表格打印与本地保存不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '项目风险登记表', item: 'https://www.util.cn/tools/risk-register-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么 9-12 分是中，8 分也算中？',
              acceptedAnswer: { '@type': 'Answer', text: '可能性与影响都是 1-5 的整数，相乘只能得到 1-6、8-10、12、15、16、20、25 这 14 个数，7、11、13、14 取不到。所以通行分档是 ≤6 低、8-12 中、≥15 高，8 分落在中档下沿。团队自定义阈值时按同样规则换算即可。' }
            },
            {
              '@type': 'Question',
              name: '可能性 4 和影响 4，到底先处理哪个？',
              acceptedAnswer: { '@type': 'Answer', text: '分数相同时看影响不可接受线：影响分更高（后果更重）的优先。低概率但致命的风险值得提前布防，高概率但影响轻微的靠流程兜底，矩阵右上角永远最优先。' }
            },
            {
              '@type': 'Question',
              name: '已关闭的风险要从矩阵里去掉吗？',
              acceptedAnswer: { '@type': 'Answer', text: '台账建议保留已关闭风险供审计与复盘，但当前暴露度看还开着的风险。工具默认全部计入并标注口径，勾选排除已关闭后矩阵与汇总即时切换。' }
            },
            {
              '@type': 'Question',
              name: '导出的 CSV 打开是乱码怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '导出的 CSV 已带 UTF-8 BOM，用 Excel 或 WPS 直接双击打开即可正常显示中文；文本编辑器打开乱码时请把编码切到 UTF-8。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 定级口径：分数 = P×I；≥15 高、8-12 中、≤6 低（通行默认阈值，团队可自定义后同规则换算）。
// 1-5 相乘不可能得到 7/11/13/14，8 分（2×4 或 4×2）按中处理。
const HIGH_THRESHOLD = 15
const MID_LOW_BOUND = 8 // 中档下沿（≤6 为低；7 不可能取到）

const CATEGORIES = ['技术', '进度', '成本', '人员', '外部', '合规']
const STATUS = ['开放', '缓解中', '已关闭']

const LEVEL_META = {
  high: { label: '高', rule: '分数 ≥ 15' },
  mid: { label: '中', rule: '分数 8-12' },
  low: { label: '低', rule: '分数 ≤ 6' }
}

const IMPACT_HINTS = ['可忽略', '轻微', '一般', '严重', '致命'] // 影响 I=1..5
const PROB_HINTS = ['极罕见', '较低', '偶发', '较常', '频繁'] // 可能性 P=1..5

// 打分钳制到 [1,5]（非法输入按 1 处理）
function clampScore5(v) {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return 1
  return Math.min(5, Math.max(1, n))
}

// 分数 → 等级（'high' | 'mid' | 'low'）
function levelOfScore(score) {
  if (score >= HIGH_THRESHOLD) return 'high'
  if (score >= MID_LOW_BOUND) return 'mid'
  return 'low'
}

// 单条风险评估：{ p, i, score, level }（p/i 越界自动钳制）
function riskOf(r) {
  const p = clampScore5(r && r.p)
  const i = clampScore5(r && r.i)
  const score = p * i
  return { p, i, score, level: levelOfScore(score) }
}

// 5×5 矩阵计数：matrix[p-1][i-1] = 该格风险条数；excludeClosed 为 true 时排除「已关闭」
function matrixOf(risks, excludeClosed) {
  const matrix = [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0]
  ]
  for (const r of Array.isArray(risks) ? risks : []) {
    if (excludeClosed && r && r.status === '已关闭') continue
    const a = riskOf(r)
    matrix[a.p - 1][a.i - 1] += 1
  }
  return matrix
}

// 暴露度汇总：各等级计数（口径与 matrixOf 一致）
function exposureOf(risks, excludeClosed) {
  const counts = { high: 0, mid: 0, low: 0 }
  for (const r of Array.isArray(risks) ? risks : []) {
    if (excludeClosed && r && r.status === '已关闭') continue
    counts[riskOf(r).level] += 1
  }
  return counts
}

// Top N：按分数降序，分数相同保持登记顺序（稳定排序：以数组下标为次序键）
function topRisks(risks, n, excludeClosed) {
  const list = (Array.isArray(risks) ? risks : [])
    .map((r, index) => ({ r, index }))
    .filter(({ r }) => !(excludeClosed && r && r.status === '已关闭'))
  list.sort((a, b) => {
    const diff = riskOf(b.r).score - riskOf(a.r).score
    if (diff !== 0) return diff
    return a.index - b.index
  })
  return list.slice(0, Math.max(0, n)).map(({ r }) => r)
}

// CSV 组装：首行表头 + 每风险一行；字段含逗号/引号/换行时加双引号包裹（内部引号翻倍），前置 UTF-8 BOM
function buildCsv(project, risks) {
  const header = ['序号', '风险描述', '类别', '可能性P', '影响I', '风险分数', '等级', '缓解措施', '负责人', '状态']
  const esc = (v) => {
    const s = String(v == null ? '' : v)
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
    return s
  }
  const lines = [header.join(',')]
  ;(Array.isArray(risks) ? risks : []).forEach((r, index) => {
    const a = riskOf(r)
    lines.push([
      index + 1,
      esc(r && r.desc),
      esc(r && r.category),
      a.p,
      a.i,
      a.score,
      LEVEL_META[a.level].label,
      esc(r && r.mitigation),
      esc(r && r.owner),
      esc(r && r.status)
    ].join(','))
  })
  return '\uFEFF' + [project ? `# 项目：${project}` : '', ...lines].filter(Boolean).join('\n')
}

// Markdown 导出（含矩阵快照与清单表）
function buildMarkdown(project, risks, excludeClosed) {
  const list = Array.isArray(risks) ? risks : []
  const mx = matrixOf(list, excludeClosed)
  const exp = exposureOf(list, excludeClosed)
  const lines = []
  lines.push('# 项目风险登记表' + (project ? '（' + project + '）' : ''))
  lines.push('')
  lines.push(`> 定级口径：分数 = 可能性 P(1-5) × 影响 I(1-5)，≥15 高 / 8-12 中 / ≤6 低；${excludeClosed ? '已排除已关闭风险' : '含已关闭风险'}。`)
  lines.push(`> 暴露度：高 ${exp.high} 条 · 中 ${exp.mid} 条 · 低 ${exp.low} 条`)
  lines.push('')
  lines.push('## 风险矩阵快照（行 = 可能性 P，列 = 影响 I，格内为风险条数）')
  lines.push('')
  lines.push('| P \\ I | 1 | 2 | 3 | 4 | 5 |')
  lines.push('| --- | --- | --- | --- | --- | --- |')
  for (let p = 5; p >= 1; p--) {
    const cells = []
    for (let i = 1; i <= 5; i++) {
      const n = mx[p - 1][i - 1]
      cells.push(n > 0 ? `${n}（${LEVEL_META[levelOfScore(p * i)].label}）` : '0')
    }
    lines.push(`| P=${p} | ${cells.join(' | ')} |`)
  }
  lines.push('')
  lines.push('## 风险清单（按分数降序）')
  lines.push('')
  lines.push('| 序号 | 风险描述 | 类别 | P | I | 分数 | 等级 | 缓解措施 | 负责人 | 状态 |')
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |')
  const escMd = (v) => String(v == null ? '' : v).replace(/\|/g, '\\|').replace(/\n/g, ' ')
  const sorted = topRisks(list, list.length, excludeClosed)
  sorted.forEach((r, index) => {
    const a = riskOf(r)
    lines.push(`| ${index + 1} | ${escMd(r.desc)} | ${escMd(r.category)} | ${a.p} | ${a.i} | ${a.score} | ${LEVEL_META[a.level].label} | ${escMd(r.mitigation)} | ${escMd(r.owner)} | ${escMd(r.status)} |`)
  })
  if (!sorted.length) lines.push('| - |（暂无风险登记）| - | - | - | - | - | - | - | - |')
  lines.push('')
  lines.push('> 高风险须指定负责人与缓解时限并纳入例会跟踪；本表为定性评估记录，不替代正式风险审计。')
  return lines.join('\n')
}

// 草稿行收敛：字段类型 / 取值范围归一，防止脏数据进入渲染与导出
function sanitizeRisk(raw) {
  if (!raw || typeof raw !== 'object') return null
  const cat = CATEGORIES.includes(raw.category) ? raw.category : CATEGORIES[0]
  const st = STATUS.includes(raw.status) ? raw.status : STATUS[0]
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id.slice(0, 40) : 'k' + Math.random().toString(36).slice(2, 10),
    desc: typeof raw.desc === 'string' ? raw.desc.slice(0, 60) : '',
    category: cat,
    p: clampScore5(raw.p),
    i: clampScore5(raw.i),
    mitigation: typeof raw.mitigation === 'string' ? raw.mitigation.slice(0, 60) : '',
    owner: typeof raw.owner === 'string' ? raw.owner.slice(0, 16) : '',
    status: st
  }
}

// 示例数据：覆盖 6 类别 / 三档等级 / 三种状态
const EXAMPLE_RISKS = [
  { desc: '核心接口性能不达标，大促期间页面超时', category: '技术', p: 3, i: 5, mitigation: '提前全链路压测，热点数据加缓存', owner: '张工', status: '缓解中' },
  { desc: '设计资源被并行项目抽走，排期延后', category: '进度', p: 4, i: 3, mitigation: '锁定关键页面的设计排期并每日同步', owner: '李敏', status: '开放' },
  { desc: '外包测试人力预算未批，UAT 缩水', category: '成本', p: 3, i: 3, mitigation: '申报追加预算，同时准备内测替代方案', owner: '王芳', status: '开放' },
  { desc: '核心后端开发离职交接期空档', category: '人员', p: 2, i: 4, mitigation: '文档化关键模块，安排 AB 角互备', owner: '陈立', status: '缓解中' },
  { desc: '上游供应商接口变更未提前通知', category: '外部', p: 2, i: 2, mitigation: '订阅变更公告，联系人月度对齐', owner: '赵云', status: '开放' },
  { desc: '新功能上线未过合规审查被要求下架', category: '合规', p: 1, i: 4, mitigation: '上线清单加入法务合规检查点', owner: '周洁', status: '缓解中' },
  { desc: '历史遗留脚本报错刷屏告警群', category: '技术', p: 2, i: 1, mitigation: '迁移至新任务系统后下线', owner: '张工', status: '已关闭' }
]

// ---------- 页面状态与交互 ----------
const STORAGE_KEY = 'util:risk-register:v1'

let seq = 0
const uid = () => 'r' + Date.now().toString(36) + (++seq).toString(36)

const project = ref('')
const risks = ref([])
const excludeClosed = ref(false)
const cellFilter = ref(null) // { p, i } | null
const draftLoaded = ref(false)

const printPageCss = '@page { size: A4 portrait; margin: 12mm; }'

const pRows = [5, 4, 3, 2, 1] // 矩阵行：可能性从上到下 5→1

const matrix = computed(() => matrixOf(risks.value, excludeClosed.value))
const exposure = computed(() => exposureOf(risks.value, excludeClosed.value))
const top3 = computed(() => topRisks(risks.value, 3, excludeClosed.value))

// 带评估结果的行视图（保持登记顺序）
const assessedRows = computed(() => risks.value.map((r) => {
  const a = riskOf(r)
  return { r, ...a }
}))

// 矩阵格筛选后的清单
const filteredRisks = computed(() => {
  if (!cellFilter.value) return assessedRows.value
  return assessedRows.value.filter((row) => row.p === cellFilter.value.p && row.i === cellFilter.value.i)
})

// 打印 / 导出用：按分数降序 + 序号（Top3 同一稳定排序口径）
const sortedRows = computed(() => {
  const rows = risks.value.map((r, index) => ({ r, index, ...riskOf(r) }))
  rows.sort((a, b) => {
    const diff = b.score - a.score
    if (diff !== 0) return diff
    return a.index - b.index
  })
  return rows.map((row, i) => ({ r: row.r, p: row.p, i: row.i, score: row.score, level: row.level, no: i + 1 }))
})

const emptyDescCount = computed(() => risks.value.filter((r) => !r.desc.trim()).length)

const todayText = computed(() => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
})

function levelChipClass(level) {
  if (level === 'high') return 'bg-red-500/10 text-red-600 border-red-500/20'
  if (level === 'mid') return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
  return 'bg-green-500/10 text-green-600 border-green-500/20'
}

function levelCellClass(level) {
  if (level === 'high') return 'bg-red-500/15'
  if (level === 'mid') return 'bg-amber-500/15'
  return 'bg-green-500/15'
}

function levelCardClass(level) {
  if (level === 'high') return 'bg-red-500/10 border-red-500/20 text-red-600'
  if (level === 'mid') return 'bg-amber-500/10 border-amber-500/20 text-amber-600'
  return 'bg-green-500/10 border-green-500/20 text-green-600'
}

// 矩阵格样式：底色按该格定级；被选中筛选时高亮描边
function cellClass(p, n) {
  const lv = levelOfScore(p * n)
  const base = levelCellClass(lv)
  const selected = cellFilter.value && cellFilter.value.p === p && cellFilter.value.i === n
  const has = matrix.value[p - 1][n - 1] > 0
  return [
    base,
    selected ? 'ring-2 ring-primary ring-inset' : '',
    has ? 'text-foreground font-bold' : 'text-muted-foreground/50'
  ]
}

function toggleCellFilter(p, n) {
  if (cellFilter.value && cellFilter.value.p === p && cellFilter.value.i === n) {
    cellFilter.value = null
  } else {
    cellFilter.value = { p, i: n }
  }
}

// ---------- 行操作 ----------
function addRisk() {
  risks.value.push({
    id: uid(),
    desc: '',
    category: CATEGORIES[0],
    p: 3,
    i: 3,
    mitigation: '',
    owner: '',
    status: STATUS[0]
  })
}

function removeRisk(id) {
  risks.value = risks.value.filter((r) => r.id !== id)
}

function loadExample() {
  project.value = project.value || '新版官网改版项目'
  risks.value = EXAMPLE_RISKS.map((r) => ({ ...r, id: uid() }))
  cellFilter.value = null
}

function clearAll() {
  if (!window.confirm('将清空全部风险登记与项目名称（不可恢复，草稿也会清除），确定继续吗？')) return
  risks.value = []
  project.value = ''
  cellFilter.value = null
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) { /* 忽略 */ }
}

// ---------- 导出 ----------
function copyText(text, okMsg) {
  const write = async () => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
  }
  write()
    .then(() => alert(okMsg || '已复制'))
    .catch(() => alert('复制失败，请手动选择内容复制'))
}

function copyMarkdown() {
  if (!risks.value.length) {
    alert('暂无风险登记，请先添加风险或载入示例')
    return
  }
  copyText(buildMarkdown(project.value, risks.value, excludeClosed.value), '已复制 Markdown（含矩阵快照），可粘贴进飞书 / 语雀 / Notion')
}

function downloadCsv() {
  if (!risks.value.length) {
    alert('暂无风险登记，请先添加风险或载入示例')
    return
  }
  try {
    const csv = buildCsv(project.value, risks.value)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'risk-register.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (error) {
    alert('下载失败：' + (error && error.message ? error.message : error))
  }
}

function printSheet() {
  window.print()
}

// ---------- 本地持久化（onMounted 后读写） ----------
function persist() {
  if (!draftLoaded.value) return
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      v: 1,
      project: project.value,
      excludeClosed: excludeClosed.value,
      risks: risks.value
    }))
  } catch (e) { /* 隐私模式 / 配额限制：静默 */ }
}

onMounted(() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const d = JSON.parse(raw)
      if (d && typeof d === 'object') {
        if (typeof d.project === 'string') project.value = d.project.slice(0, 40)
        if (typeof d.excludeClosed === 'boolean') excludeClosed.value = d.excludeClosed
        if (Array.isArray(d.risks)) risks.value = d.risks.map(sanitizeRisk).filter(Boolean).slice(0, 100)
      }
    }
  } catch (e) { /* 草稿损坏：使用空表 */ }
  draftLoaded.value = true
  // watch 注册在草稿恢复之后：首次恢复不回写，仅跟踪用户修改
  watch([project, excludeClosed, risks], persist, { deep: true })
  addRecentTool('risk-register-generator')
})
</script>

<style scoped>
/* A4 打印版式：屏幕隐藏，打印显示 */
.print-sheet {
  display: none;
}
.ps-title {
  font-size: 18pt;
  font-weight: 700;
  text-align: center;
  margin-bottom: 4mm;
  font-family: ui-sans-serif, system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.ps-meta {
  font-size: 9pt;
  color: #374151;
  border-bottom: 1.5px solid #d1d5db;
  padding-bottom: 3mm;
  margin-bottom: 5mm;
  font-family: ui-sans-serif, system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.ps-sec {
  font-size: 11pt;
  font-weight: 700;
  margin: 4mm 0 2mm;
  font-family: ui-sans-serif, system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.ps-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 8.5pt;
  font-family: ui-sans-serif, system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.ps-table th,
.ps-table td {
  border: 0.5px solid #9ca3af;
  padding: 1.4mm 2mm;
  text-align: center;
  vertical-align: top;
}
.ps-table th {
  background: #f3f4f6;
  font-weight: 600;
}
.ps-matrix td.lv-high { background: #fee2e2; }
.ps-matrix td.lv-mid { background: #fef3c7; }
.ps-matrix td.lv-low { background: #dcfce7; }
.w-p { width: 12%; }
.w-no { width: 6%; }
.w-desc { width: 24%; text-align: left !important; }
.w-cat { width: 8%; }
.w-pi { width: 5%; }
.w-lv { width: 7%; }
.w-mit { width: 24%; text-align: left !important; }
.w-owner { width: 9%; }
.w-st { width: 8%; }
.ps-sign {
  margin-top: 8mm;
  font-size: 9.5pt;
  font-family: ui-sans-serif, system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.ps-foot {
  margin-top: 5mm;
  font-size: 7.5pt;
  color: #6b7280;
  line-height: 1.6;
  font-family: ui-sans-serif, system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

@media print {
  .no-print {
    display: none !important;
  }
  .print-grid {
    display: block !important;
  }
  :global(main) {
    overflow: visible !important;
    height: auto !important;
  }
  .print-sheet {
    display: block !important;
  }
  .ps-table tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .ps-table, .ps-matrix td {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
</style>
