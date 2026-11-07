<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- A4 打印页边距（横向，容纳多科目列） -->
    <component :is="'style'" v-html="printPageCss"></component>

    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <CalendarDays class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">教学进度计划表</h1>
          <p class="text-sm text-muted-foreground mt-1">按学期起止与每周课时逐周排课，节假期自动剔除灰显，多科目课时分配与单元内容规划，导出 Markdown 与 A4 打印</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线教学进度计划表生成工具：设定学期起止日期、各科目每周课时与节假期日期段，自动生成逐周进度表——
        周次、日期区间、每科目每周教学内容（行内可编辑），假期周灰显标注、部分假期周带名称徽标；
        自动计算总周数、假期剔除后的有效教学周与每科目可用课时（有效周 × 周课时），按科目课时占比给出分配与单元数提示，
        并支持预留复习 / 考试周。导出 Markdown、A4 横版打印，草稿本地保存不上传。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：学期设置 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4 no-print">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <CalendarDays class="w-5 h-5 mr-2 text-primary" /> 学期设置
          </h2>
          <button
            type="button"
            @click="loadExample"
            class="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-medium inline-flex items-center gap-1 transition"
          >
            <Play class="w-3.5 h-3.5" /> 填充示例
          </button>
        </div>

        <div class="space-y-2">
          <div>
            <label for="plan-name" class="block text-xs text-muted-foreground mb-1">学期名称</label>
            <input
              id="plan-name"
              v-model="termName"
              type="text"
              maxlength="30"
              placeholder="如：2026 春季学期"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label for="plan-start" class="block text-xs text-muted-foreground mb-1">开始日期（第 1 周起点）</label>
              <input
                id="plan-start"
                v-model="startDate"
                type="date"
                class="w-full px-2 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label for="plan-end" class="block text-xs text-muted-foreground mb-1">结束日期</label>
              <input
                id="plan-end"
                v-model="endDate"
                type="date"
                class="w-full px-2 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <p v-if="dateError" class="text-xs text-red-600 flex items-start gap-1">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {{ dateError }}
          </p>
          <p v-else-if="!isMondayStart && plan.totalWeeks > 0" class="text-xs text-amber-600 flex items-start gap-1">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> 开始日不是周一：周次仍按开始日起每 7 天划分，建议选周一与校历对齐。
          </p>
        </div>

        <!-- 科目列表 -->
        <div class="space-y-2 pt-2 border-t border-border">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-foreground">科目与周课时（{{ subjects.length }} 门）</p>
            <button
              type="button"
              @click="addSubject"
              class="px-2.5 py-1 text-xs rounded-lg border border-border bg-background hover:bg-muted text-foreground inline-flex items-center gap-1 transition"
            >
              <Plus class="w-3 h-3" /> 添加科目
            </button>
          </div>
          <div
            v-for="s in subjects"
            :key="s.id"
            class="flex flex-wrap items-center gap-1.5 p-2 rounded-lg border bg-muted/30 border-border"
          >
            <input
              v-model="s.name"
              type="text"
              maxlength="12"
              placeholder="科目名"
              class="flex-1 min-w-[70px] px-2 py-1.5 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <label class="flex items-center gap-1 text-[10px] text-muted-foreground">
              每周
              <input
                v-model.number="s.periods"
                type="number"
                min="1"
                max="35"
                step="1"
                class="w-12 px-1.5 py-1.5 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              节
            </label>
            <label class="flex items-center gap-1 text-[10px] text-muted-foreground">
              单元
              <input
                v-model.number="s.units"
                type="number"
                min="0"
                max="60"
                step="1"
                placeholder="可选"
                class="w-12 px-1.5 py-1.5 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              个
            </label>
            <button
              type="button"
              @click="removeSubject(s.id)"
              class="w-7 h-7 flex-shrink-0 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition"
              aria-label="删除该科目"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
          <p v-if="!subjects.length" class="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2.5 text-center border border-dashed border-border">
            至少添加一门科目才会排课。
          </p>
        </div>

        <!-- 节假期 -->
        <div class="space-y-2 pt-2 border-t border-border">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-foreground">节假期（{{ holidays.length }} 段）</p>
            <button
              type="button"
            @click="addHoliday"
              class="px-2.5 py-1 text-xs rounded-lg border border-border bg-background hover:bg-muted text-foreground inline-flex items-center gap-1 transition"
            >
              <Plus class="w-3 h-3" /> 添加假期
            </button>
          </div>
          <div
            v-for="(h, idx) in holidays"
            :key="h.id"
            class="flex flex-wrap items-center gap-1.5 p-2 rounded-lg border bg-muted/30 border-border"
          >
            <input
              v-model="h.name"
              type="text"
              maxlength="12"
              placeholder="名称"
              class="w-20 px-2 py-1.5 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              v-model="h.start"
              type="date"
              class="flex-1 min-w-[110px] px-1.5 py-1.5 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span class="text-[10px] text-muted-foreground">至</span>
            <input
              v-model="h.end"
              type="date"
              class="flex-1 min-w-[110px] px-1.5 py-1.5 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              @click="removeHoliday(idx)"
              class="w-7 h-7 flex-shrink-0 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition"
              aria-label="删除该假期"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
          <p class="text-[10px] text-muted-foreground leading-relaxed">
            口径：假期覆盖整周（周内无一个可上课日）→ 该周整周剔除并灰显；假期只占一周的部分 → 该周保留、标注假期名称，课时未自动扣减，请在教学内容里自行调整。
          </p>
        </div>

        <!-- 预留复习考试周 -->
        <div class="pt-2 border-t border-border">
          <label class="flex items-center justify-between gap-2 text-sm text-foreground">
            预留复习 / 考试周
            <input
              v-model.number="reserveWeeks"
              type="number"
              min="0"
              max="12"
              step="1"
              class="w-16 px-2 py-1.5 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <p class="text-[10px] text-muted-foreground mt-1">从有效教学周末尾预留，不计入新课排课课时；第 1-{{ Math.max(0, effectiveWeeks - reserveWeeks) }} 周建议排新课，其后进入复习考试。</p>
        </div>
      </div>

      <!-- 右：进度表预览 -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 统计与分配 -->
        <div class="bg-card border border-border rounded-lg p-6 print-area">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 class="text-lg font-semibold flex items-center">
              <Calculator class="w-5 h-5 mr-2 text-primary" /> 课时汇总
            </h2>
            <div class="flex flex-wrap items-center gap-2 no-print">
              <button
                type="button"
                @click="clearAll"
                class="px-3 py-1.5 text-xs rounded-lg border border-border bg-background hover:bg-muted text-foreground inline-flex items-center gap-1 transition"
              >
                <RefreshCw class="w-3.5 h-3.5" /> 清空
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

          <div class="grid grid-cols-4 gap-2 mb-4">
            <div class="bg-muted/50 rounded-xl p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">总周数</p>
              <p class="text-xl font-bold text-foreground">{{ plan.totalWeeks }}</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">假期整周剔除</p>
              <p class="text-xl font-bold text-foreground">{{ holidayWeekCount }}</p>
            </div>
            <div class="bg-primary/10 rounded-xl p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">有效教学周</p>
              <p class="text-xl font-bold text-primary">{{ effectiveWeeks }}</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">周排课总课时</p>
              <p class="text-xl font-bold text-foreground">{{ totalWeeklyPeriods }}</p>
            </div>
          </div>

          <!-- 各科目分配 -->
          <h3 class="text-sm font-semibold text-foreground mb-2">各科目可用课时（有效教学周 × 周课时，按课时占比分配）</h3>
          <div v-if="allocations.length" class="space-y-1.5 mb-1">
            <div v-for="a in allocations" :key="a.id" class="flex items-center gap-2 text-xs">
              <span class="w-16 truncate font-medium text-foreground" :title="a.name">{{ a.name }}</span>
              <div class="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div class="h-full bg-primary rounded-full" :style="{ width: (a.ratio * 100).toFixed(1) + '%' }"></div>
              </div>
              <span class="w-40 text-right text-muted-foreground">
                {{ a.periods }} 节/周 × {{ a.weeks }} 周 = <b class="text-foreground">{{ a.totalPeriods }}</b> 节（{{ (a.ratio * 100).toFixed(0) }}%）
                <template v-if="a.perUnit">｜ {{ a.units }} 单元 ≈ 每单元 {{ a.perUnit }} 节</template>
              </span>
            </div>
          </div>
          <p v-else class="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 text-center">先在左侧添加科目与每周课时，这里会自动算出各科目可用课时与占比。</p>
          <p v-if="allocations.length && reserveWeeks > 0" class="text-xs text-amber-600 mt-2">
            已预留 {{ reserveWeeks }} 周复习考试：新课实际可用 {{ Math.max(0, effectiveWeeks - reserveWeeks) }} 周，各科目新课课时按 {{ Math.max(0, effectiveWeeks - reserveWeeks) }} × 周课时估算。
          </p>
        </div>

        <!-- 逐周进度表 -->
        <div class="bg-card border border-border rounded-lg p-6 print-area">
          <h2 class="text-lg font-semibold flex items-center mb-4 no-print">
            <TableProperties class="w-5 h-5 mr-2 text-primary" /> 逐周进度表（教学内容行内可编辑）
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-sm week-table">
              <thead>
                <tr>
                  <th class="px-2 py-2 border border-border bg-muted/70 text-xs font-semibold text-foreground whitespace-nowrap">周次</th>
                  <th class="px-2 py-2 border border-border bg-muted/70 text-xs font-semibold text-foreground whitespace-nowrap">日期区间</th>
                  <th
                    v-for="s in subjects"
                    :key="'h' + s.id"
                    class="px-2 py-2 border border-border bg-muted/70 text-xs font-semibold text-foreground whitespace-nowrap"
                  >
                    {{ s.name || '未命名' }}<span class="block text-[10px] font-normal text-muted-foreground">{{ s.periods }} 节/周</span>
                  </th>
                  <th class="px-2 py-2 border border-border bg-muted/70 text-xs font-semibold text-foreground no-print">备注</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="w in plan.weeks"
                  :key="w.no"
                  :class="w.isHoliday ? 'bg-muted/60 opacity-70' : ''"
                >
                  <td class="px-2 py-1.5 border border-border text-center font-mono text-xs text-foreground whitespace-nowrap">
                    第 {{ w.no }} 周
                    <span v-if="!w.isHoliday && isReserveWeek(w)" class="block text-[10px] text-amber-600">复习/考试</span>
                  </td>
                  <td class="px-2 py-1.5 border border-border text-center font-mono text-xs text-foreground whitespace-nowrap">{{ w.label }}</td>
                  <template v-if="!w.isHoliday">
                    <td
                      v-for="s in subjects"
                      :key="'c' + w.no + '-' + s.id"
                      class="px-1 py-1 border border-border"
                    >
                      <input
                        v-model="contents[cellKey(w.no, s.id)]"
                        type="text"
                        maxlength="40"
                        :placeholder="s.name ? s.name + ' 第几单元 / 内容' : '教学内容'"
                        class="w-full min-w-[110px] px-1.5 py-1 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </td>
                  </template>
                  <template v-else>
                    <td
                      v-for="s in subjects"
                      :key="'ch' + w.no + '-' + s.id"
                      class="px-2 py-1.5 border border-border text-center text-xs text-muted-foreground"
                    >
                      假期
                    </td>
                  </template>
                  <td class="px-2 py-1.5 border border-border text-center text-[11px] text-muted-foreground no-print">
                    <template v-if="w.isHoliday">假期：{{ w.holidayNames.join('、') }}</template>
                    <template v-else-if="w.holidayNames.length">含假期：{{ w.holidayNames.join('、') }}（课时未扣减）</template>
                    <template v-else>—</template>
                  </td>
                </tr>
                <tr v-if="!plan.weeks.length">
                  <td :colspan="3 + subjects.length" class="px-3 py-6 border border-border text-center text-xs text-muted-foreground">
                    设置学期起止日期后自动生成逐周进度表；可点左侧「填充示例」快速体验。
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="no-print text-xs text-muted-foreground leading-relaxed mt-3 flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
            <span>
              灰显整行为假期整周（不占课时）；备注列标注部分假期周。教学内容会自动保存在本机浏览器，导出 Markdown 或打印前请先把各周内容填好。
            </span>
          </p>
        </div>
      </div>
    </div>

    <!-- A4 打印版式（仅打印时显示） -->
    <div class="print-sheet">
      <p class="ps-title">{{ termName || '教学进度计划表' }}</p>
      <p class="ps-meta">
        {{ plan.startLabel || '____年__月__日' }} 至 {{ plan.endLabel || '____年__月__日' }} ｜ 总 {{ plan.totalWeeks }} 周 · 假期整周 {{ holidayWeekCount }} 周 · 有效教学 {{ effectiveWeeks }} 周（预留复习/考试 {{ reserveWeeks }} 周）
      </p>
      <table class="ps-table">
        <thead>
          <tr>
            <th class="w-no">周次</th>
            <th class="w-date">日期区间</th>
            <th v-for="s in subjects" :key="'ph' + s.id" class="w-subject">{{ s.name || '科目' }}（{{ s.periods }}节/周）</th>
            <th class="w-note">备注</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="w in plan.weeks" :key="'pw' + w.no" :class="w.isHoliday ? 'holiday-row' : ''">
            <td>第 {{ w.no }} 周{{ !w.isHoliday && isReserveWeek(w) ? '（复习/考试）' : '' }}</td>
            <td>{{ w.label }}</td>
            <template v-if="!w.isHoliday">
              <td v-for="s in subjects" :key="'pc' + w.no + '-' + s.id">{{ contents[cellKey(w.no, s.id)] || '' }}</td>
            </template>
            <template v-else>
              <td v-for="s in subjects" :key="'phc' + w.no + '-' + s.id" class="holiday-cell">假期</td>
            </template>
            <td>
              <template v-if="w.isHoliday">{{ w.holidayNames.join('、') }}</template>
              <template v-else-if="w.holidayNames.length">含假期：{{ w.holidayNames.join('、') }}</template>
            </td>
          </tr>
        </tbody>
      </table>
      <p class="ps-foot">
        说明：有效教学周 = 总周数 − 假期整周；各科目可用课时 = 有效教学周 × 每周课时；末尾 {{ reserveWeeks }} 周为复习/考试预留。
        学期实际校历（调休、运动会等）请按本校安排微调。
      </p>
    </div>

    <!-- SEO 内容区（details/summary 折叠） -->
    <details class="no-print group bg-card border border-border rounded-lg mb-12">
      <summary class="cursor-pointer select-none px-6 py-4 text-lg font-semibold text-foreground flex items-center justify-between">
        <span><span class="text-primary mr-2">#</span>教学进度计划怎么编才科学？</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div class="px-6 pb-6">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>教学进度计划表的编制要点</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          教学进度计划表（学期教学计划）把「这门课一共多少课时、每周上什么、讲到哪里考试」铺到校历上，是备课、教研检查与代课衔接的底账。
          编制的通用顺序：先定学期起止 → 扣掉假期与大型活动周 → 留出复习考试周 → 剩余的「有效教学周 × 每周课时」才是可分配的新课课时 →
          按教材单元切分到周。本工具按这个顺序自动计算：假期整周剔除灰显、部分假期周标注提醒、预留复习考试周不计入新课课时。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">一定要留复习周和弹性周</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>复习 / 考试周建议预留 1-3 周（本页可设置），不要把新课压到最后一周——期末周几乎必然被活动、调课侵蚀。</li>
          <li>按「周数 × 0.9」的心态排新课：20 周学期按 18 周排内容，剩下的 2 周自然吸收运动会、公开课、临时调课。</li>
          <li>多科目共用一个校历时，假期对每门课是等量扣减；但各科单元数不同，应按「每单元可分课时」倒推内容切分，而不是每周硬凑进度。</li>
          <li>进度表里每格写「单元 + 知识点」两级（如「三单元 2 课时：分数的意义」），代课与调课时可直接定位。</li>
          <li>开学第 1 周与长假后第 1 周容量偏低，安排复习衔接或测验比安排新授更现实。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">假期周与部分假期周怎么处理？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          本页口径：假期覆盖整周（周内没有一个可上课日）→ 整周剔除、灰显标注，不占课时；
          假期只占一周的一部分（如清明放周一一天）→ 该周保留并标注假期名称，但课时未自动扣减——因为多数学校会用调休补回，
          何时补、补多少因校而异，建议你在该周教学内容里自行写明（如「周四补周一课」）。这比自动猜调休更可靠。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">和学期计算器联动</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          还没确定学期起止日期？先用站内<a href="/tools/semester-calculator/" class="text-primary underline">学期计算器</a>按学年学期推算起止日期，
          再回到本页排逐周进度；需要给单个项目或活动排甘特图，可用<a href="/tools/gantt-chart-maker/" class="text-primary underline">甘特图生成器</a>按日精确铺期。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">可用课时是怎么算出来的？</h3>
            <p class="text-sm text-muted-foreground mt-1">有效教学周 = 总周数（开始日起每 7 天为一周，含首尾）− 假期整周；每科目可用课时 = 有效教学周 × 该科目每周课时。预留的复习 / 考试周只影响「新课可用课时」提示，不从总量里扣除，方便对照。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">开始日期不是周一会怎样？</h3>
            <p class="text-sm text-muted-foreground mt-1">周次仍按开始日起每 7 天划分，页面会提示建议改选周一；如果学校校历从周三开学，直接填周三也能用，只是「周」与自然周不对齐。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">教学内容存在哪里？会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不上传。学期设置、科目、假期与每周教学内容都只保存在当前浏览器的 localStorage，下次打开自动恢复；清除浏览器数据会丢失，长期留存请复制 Markdown 或打印存 PDF。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么部分假期周不自动扣课时？</h3>
            <p class="text-sm text-muted-foreground mt-1">部分假期（放 1-3 天）各校调休规则不同，有的补课有的不补，自动扣减反而容易出错。工具会在备注列标出含假期的周，由你按学校安排在教学内容里调整，口径更透明。</p>
          </div>
        </div>
      </div>
    </details>

    <div class="no-print">
      <RelatedTools :currentToolId="'teaching-plan-planner'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  CalendarDays, Plus, X, Copy, Printer, RefreshCw, Play,
  Info, ChevronDown, TriangleAlert, Calculator, TableProperties
} from 'lucide-vue-next'
import { useSeoMeta, useHead } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '教学进度计划表 - 学期逐周排课与课时分配工具',
  description: '免费在线教学进度计划表生成器：设定学期起止、各科目每周课时与节假期日期段，自动生成逐周进度表（周次/日期区间/各科目教学内容行编辑），假期周自动剔除灰显，自动计算有效教学周与各科目可用课时占比、单元数提示，支持预留复习考试周，导出 Markdown 与 A4 横版打印，本地保存不上传',
  keywords: '教学进度计划表,学期教学计划,课时安排表,备课计划,教学日历,排课工具',
  author: '有条工具',
  ogTitle: '教学进度计划表 - 学期逐周排课与课时分配工具 | 有条工具',
  ogDescription: '学期起止+周课时+节假期自动生成逐周教学进度表，假期周剔除灰显，可用课时与单元分配自动计算，Markdown 导出与 A4 打印。',
  ogUrl: 'https://www.util.cn/tools/teaching-plan-planner',
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
          name: '教学进度计划表',
          url: 'https://www.util.cn/tools/teaching-plan-planner',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '学期起止自动生成逐周进度表（周次/日期区间）',
            '多科目每周课时与可用课时占比自动分配',
            '节假期整周剔除灰显、部分假期周标注',
            '每科目每单元教学内容行内编辑',
            '预留复习/考试周弹性设置',
            'Markdown 导出与 A4 横版打印，本地保存不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '教学进度计划表', item: 'https://www.util.cn/tools/teaching-plan-planner/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '可用课时是怎么算出来的？',
              acceptedAnswer: { '@type': 'Answer', text: '有效教学周 = 总周数（开始日起每 7 天为一周，含首尾）减去假期整周；每科目可用课时 = 有效教学周 × 该科目每周课时。预留的复习考试周只影响新课可用课时提示，不从总量扣除。' }
            },
            {
              '@type': 'Question',
              name: '开始日期不是周一会怎样？',
              acceptedAnswer: { '@type': 'Answer', text: '周次仍按开始日起每 7 天划分，页面会提示建议改选周一；如果学校校历从周三开学，直接填周三也能用，只是周与自然周不对齐。' }
            },
            {
              '@type': 'Question',
              name: '教学内容存在哪里？会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不上传。学期设置、科目、假期与每周教学内容都只保存在当前浏览器的 localStorage，下次打开自动恢复；清除浏览器数据会丢失，长期留存请复制 Markdown 或打印存 PDF。' }
            },
            {
              '@type': 'Question',
              name: '为什么部分假期周不自动扣课时？',
              acceptedAnswer: { '@type': 'Answer', text: '部分假期各校调休规则不同，有的补课有的不补，自动扣减容易出错。工具在备注列标出含假期的周，由教师按学校安排在教学内容里调整，口径更透明。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const DAY_MS = 86400000

// 严格解析 YYYY-MM-DD 为 UTC 零点；非法（格式错 / 日期不存在）返回 null
function parseDate(s) {
  if (typeof s !== 'string') return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  const y = +m[1]
  const mo = +m[2]
  const d = +m[3]
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  const dt = new Date(Date.UTC(y, mo - 1, d))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null
  return dt
}

// Date → YYYY-MM-DD（UTC 口径）
function formatDate(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`
}

// Date → MM-DD（周表日期区间显示口径）
function fmtMd(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`
}

// 加 n 天（UTC，无时区漂移）
function addDays(d, n) {
  return new Date(d.getTime() + n * DAY_MS)
}

// 整数天数差 b - a
function daysBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS)
}

// 假期行收敛：名称 + 合法起止日期（end < start 时自动对调），无效行返回 null
function sanitizeHoliday(h) {
  if (!h || typeof h !== 'object') return null
  let s = parseDate(h.start)
  let e = parseDate(h.end)
  if (!s || !e) return null
  if (e.getTime() < s.getTime()) { const t = s; s = e; e = t }
  return { name: typeof h.name === 'string' && h.name.trim() ? h.name.trim().slice(0, 12) : '假期', start: s, end: e }
}

// 逐周排期：开始日起每 7 天为一周（含首尾），周末端裁剪到学期结束日。
// 假期整周判定：周内没有一个「学期内且不在任何假期中」的日期 → isHoliday = true（整周剔除）。
// 返回 { totalWeeks, weeks: [{ no, start, end, label, isHoliday, holidayNames }] }
function buildWeeks(startIso, endIso, holidays) {
  const start = parseDate(startIso)
  const end = parseDate(endIso)
  if (!start || !end || end.getTime() < start.getTime()) {
    return { totalWeeks: 0, weeks: [], startLabel: '', endLabel: '' }
  }
  const hols = (Array.isArray(holidays) ? holidays : [])
    .map(sanitizeHoliday)
    .filter(Boolean)
  const totalWeeks = Math.floor(daysBetween(start, end) / 7) + 1
  const weeks = []
  for (let k = 0; k < totalWeeks; k++) {
    const ws = addDays(start, k * 7)
    const weRaw = addDays(ws, 6)
    const we = weRaw.getTime() > end.getTime() ? end : weRaw
    const names = []
    let teachingDays = 0
    for (let d = 0; d < 7; d++) {
      const day = addDays(ws, d)
      if (day.getTime() > end.getTime()) break
      const inHoliday = hols.find((h) => day.getTime() >= h.start.getTime() && day.getTime() <= h.end.getTime())
      if (inHoliday) {
        if (!names.includes(inHoliday.name)) names.push(inHoliday.name)
      } else {
        teachingDays += 1
      }
    }
    weeks.push({
      no: k + 1,
      start: ws,
      end: we,
      label: `${fmtMd(ws)} ~ ${fmtMd(we)}`,
      isHoliday: teachingDays === 0,
      holidayNames: names
    })
  }
  return {
    totalWeeks,
    weeks,
    startLabel: formatDate(start),
    endLabel: formatDate(end)
  }
}

// 有效教学周（排除假期整周）
function effectiveWeeksOf(plan) {
  return plan.weeks.filter((w) => !w.isHoliday).length
}

// 各科目课时分配：可用课时 = 有效教学周 × 周课时；占比 = 周课时 / 周课时合计；
// 填了单元数时给出「每单元可分课时」提示（预留周仅用于新课课时提示，不扣总量）
function allocationOf(subjects, effWeeks, reserveWeeks) {
  const list = Array.isArray(subjects) ? subjects : []
  const totalWeekly = list.reduce((s, x) => s + clampPeriods(x && x.periods), 0)
  const newWeeks = Math.max(0, effWeeks - clampReserve(reserveWeeks))
  return list.map((s) => {
    const periods = clampPeriods(s && s.periods)
    const units = Math.max(0, Math.round(Number(s && s.units)) || 0)
    const totalPeriods = periods * effWeeks
    return {
      id: s && s.id,
      name: (s && s.name) || '未命名',
      periods,
      weeks: effWeeks,
      totalPeriods,
      ratio: totalWeekly > 0 ? periods / totalWeekly : 0,
      units,
      perUnit: units > 0 ? Math.round((totalPeriods / units) * 10) / 10 : 0,
      newTotalPeriods: periods * newWeeks
    }
  })
}

// 周课时钳制到 [1, 35]（非法输入按 1）
function clampPeriods(v) {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return 1
  return Math.min(35, Math.max(1, n))
}

// 预留周钳制到 [0, 12]（非法输入按 0）
function clampReserve(v) {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(12, n)
}

// 单元格 key：周次|科目id
function cellKey(no, subjectId) {
  return no + '|' + (subjectId || '')
}

// Markdown 导出（逐周 × 各科目教学内容 + 假期备注）
function buildPlanMarkdown(termName, plan, subjects, contents) {
  const lines = []
  lines.push('# ' + String(termName || '教学进度计划表'))
  lines.push('')
  if (plan.startLabel) lines.push(`> 学期：${plan.startLabel} 至 ${plan.endLabel} ｜ 总 ${plan.totalWeeks} 周`)
  lines.push('')
  const head = ['周次', '日期区间', ...subjects.map((s) => `${s.name || '科目'}（${clampPeriods(s.periods)}节/周）`), '备注']
  lines.push('| ' + head.join(' | ') + ' |')
  lines.push('| ' + head.map(() => '---').join(' | ') + ' |')
  const esc = (v) => String(v == null ? '' : v).replace(/\|/g, '\\|').replace(/\n/g, ' ')
  for (const w of plan.weeks) {
    const cells = subjects.map((s) => (w.isHoliday ? '假期' : esc(contents[cellKey(w.no, s.id)] || '')))
    let note = ''
    if (w.isHoliday) note = '假期：' + w.holidayNames.join('、')
    else if (w.holidayNames.length) note = '含假期：' + w.holidayNames.join('、') + '（课时未扣减）'
    lines.push(`| 第 ${w.no} 周 | ${w.label} | ${cells.join(' | ')} | ${esc(note)} |`)
  }
  lines.push('')
  lines.push('> 有效教学周 = 总周数 − 假期整周；各科目可用课时 = 有效教学周 × 每周课时。请按本校校历微调调休安排。')
  return lines.join('\n')
}

// 学科 / 假期行的草稿收敛
function sanitizeSubject(raw) {
  if (!raw || typeof raw !== 'object') return null
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id.slice(0, 40) : 's' + Math.random().toString(36).slice(2, 10),
    name: typeof raw.name === 'string' ? raw.name.slice(0, 12) : '',
    periods: clampPeriods(raw.periods),
    units: Math.max(0, Math.round(Number(raw.units)) || 0)
  }
}

// 示例：2026 春季学期 2026-02-23（周一）~ 2026-07-12（整 20 周），含整周假期与部分假期各一段
const EXAMPLE = {
  termName: '2026 春季学期',
  startDate: '2026-02-23',
  endDate: '2026-07-12',
  reserveWeeks: 2,
  subjects: [
    { name: '语文', periods: 5, units: 12 },
    { name: '数学', periods: 4, units: 10 },
    { name: '英语', periods: 3, units: 10 }
  ],
  holidays: [
    { name: '清明节', start: '2026-04-06', end: '2026-04-06' },
    { name: '劳动节周', start: '2026-05-04', end: '2026-05-10' }
  ]
}

// ---------- 页面状态与交互 ----------
const STORAGE_KEY = 'util:teaching-plan:v1'

let seq = 0
const uid = (prefix) => prefix + Date.now().toString(36) + (++seq).toString(36)

const termName = ref('')
const startDate = ref('')
const endDate = ref('')
const reserveWeeks = ref(0)
const subjects = ref([])
const holidays = ref([]) // { id, name, start, end }
const contents = ref({}) // 'no|subjectId' -> 教学内容
const draftLoaded = ref(false)

const printPageCss = '@page { size: A4 landscape; margin: 10mm; }'

const dateError = computed(() => {
  const s = parseDate(startDate.value)
  const e = parseDate(endDate.value)
  if ((startDate.value || endDate.value) && !s) return '开始日期格式非法'
  if ((startDate.value || endDate.value) && !e) return '结束日期格式非法'
  if (s && e && e.getTime() < s.getTime()) return '结束日期早于开始日期'
  return ''
})

const isMondayStart = computed(() => {
  const s = parseDate(startDate.value)
  return s ? s.getUTCDay() === 1 : true
})

const plan = computed(() => buildWeeks(startDate.value, endDate.value, holidays.value))

const holidayWeekCount = computed(() => plan.value.weeks.filter((w) => w.isHoliday).length)
const effectiveWeeks = computed(() => effectiveWeeksOf(plan.value))
const totalWeeklyPeriods = computed(() => subjects.value.reduce((s, x) => s + clampPeriods(x.periods), 0))

const allocations = computed(() => allocationOf(subjects.value, effectiveWeeks.value, reserveWeeks.value))

// 预留复习/考试周判定（从有效教学周的末尾数）
function isReserveWeek(w) {
  if (w.isHoliday) return false
  const newWeeks = Math.max(0, effectiveWeeks.value - clampReserve(reserveWeeks.value))
  return w.no > newWeeks
}

// ---------- 行操作 ----------
function addSubject() {
  subjects.value.push({ id: uid('s'), name: '', periods: 3, units: 0 })
}

function removeSubject(id) {
  subjects.value = subjects.value.filter((s) => s.id !== id)
}

function addHoliday() {
  holidays.value.push({ id: uid('h'), name: '', start: startDate.value || '', end: startDate.value || '' })
}

function removeHoliday(idx) {
  holidays.value.splice(idx, 1)
}

function loadExample() {
  termName.value = EXAMPLE.termName
  startDate.value = EXAMPLE.startDate
  endDate.value = EXAMPLE.endDate
  reserveWeeks.value = EXAMPLE.reserveWeeks
  subjects.value = EXAMPLE.subjects.map((s) => ({ ...s, id: uid('s') }))
  holidays.value = EXAMPLE.holidays.map((h) => ({ ...h, id: uid('h') }))
  contents.value = {}
}

function clearAll() {
  if (!window.confirm('将清空学期设置、科目、假期与全部教学内容（不可恢复），确定继续吗？')) return
  termName.value = ''
  startDate.value = ''
  endDate.value = ''
  reserveWeeks.value = 0
  subjects.value = []
  holidays.value = []
  contents.value = {}
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) { /* 忽略 */ }
}

// ---------- 导出 ----------
function copyMarkdown() {
  if (!plan.value.weeks.length) {
    alert('请先设置学期起止日期')
    return
  }
  const md = buildPlanMarkdown(termName.value, plan.value, subjects.value, contents.value)
  const write = async () => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(md)
    } else {
      const ta = document.createElement('textarea')
      ta.value = md
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
  }
  write()
    .then(() => alert('已复制'))
    .catch(() => alert('复制失败，请手动选择内容复制'))
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
      termName: termName.value,
      startDate: startDate.value,
      endDate: endDate.value,
      reserveWeeks: reserveWeeks.value,
      subjects: subjects.value,
      holidays: holidays.value,
      contents: contents.value
    }))
  } catch (e) { /* 隐私模式 / 配额限制：静默 */ }
}

onMounted(() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const d = JSON.parse(raw)
      if (d && typeof d === 'object') {
        if (typeof d.termName === 'string') termName.value = d.termName.slice(0, 30)
        if (typeof d.startDate === 'string' && parseDate(d.startDate)) startDate.value = d.startDate
        if (typeof d.endDate === 'string' && parseDate(d.endDate)) endDate.value = d.endDate
        const rw = Number(d.reserveWeeks)
        if (Number.isFinite(rw)) reserveWeeks.value = clampReserve(rw)
        if (Array.isArray(d.subjects)) subjects.value = d.subjects.map(sanitizeSubject).filter(Boolean).slice(0, 12)
        if (Array.isArray(d.holidays)) {
          holidays.value = d.holidays
            .map((h) => {
              const sh = sanitizeHoliday(h)
              return sh ? { id: uid('h'), name: sh.name, start: formatDate(sh.start), end: formatDate(sh.end) } : null
            })
            .filter(Boolean)
            .slice(0, 20)
        }
        if (d.contents && typeof d.contents === 'object') {
          const next = {}
          for (const k in d.contents) {
            if (typeof d.contents[k] === 'string') next[k.slice(0, 40)] = d.contents[k].slice(0, 40)
          }
          contents.value = next
        }
      }
    }
  } catch (e) { /* 草稿损坏：使用空表 */ }
  draftLoaded.value = true
  // watch 注册在草稿恢复之后：首次恢复不回写，仅跟踪用户修改
  watch([termName, startDate, endDate, reserveWeeks, subjects, holidays, contents], persist, { deep: true })
  addRecentTool('teaching-plan-planner')
})
</script>

<style scoped>
.week-table tbody tr {
  break-inside: avoid;
  page-break-inside: avoid;
}

/* A4 横版打印：屏幕隐藏，打印显示 */
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
.ps-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 8pt;
  font-family: ui-sans-serif, system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.ps-table th,
.ps-table td {
  border: 0.5px solid #9ca3af;
  padding: 1.4mm 1.8mm;
  text-align: left;
  vertical-align: top;
  word-break: break-all;
}
.ps-table th {
  background: #f3f4f6;
  font-weight: 600;
  text-align: center;
}
.w-no { width: 7%; text-align: center !important; }
.w-date { width: 11%; text-align: center !important; white-space: nowrap; }
.w-subject { width: auto; }
.w-note { width: 14%; }
.holiday-row td { background: #f3f4f6; color: #6b7280; }
.holiday-cell { text-align: center !important; color: #6b7280; }
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
  .ps-table {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
</style>
