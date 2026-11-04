<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Baby class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">生育津贴计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">98 天基础产假 + 各地奖励假 + 难产/多胞胎加项，按单位月均缴费工资估算津贴并对比产假工资就高发放</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线生育津贴计算器：输入单位上年度月平均缴费工资与所在省份，按「基础 98 天 + 各省奖励假 + 难产 15 天 + 多胞胎每多一婴 15 天」自动合计产假天数，
        以「单位月均缴费工资 ÷ 30 × 产假天数」估算生育津贴金额；可填写个人月工资对比「生育津贴 vs 产假工资」就高发放与补差金额，
        附各省产假天数速查表、申报时限与材料清单提示。全部计算在浏览器本地完成，不上传、不保存任何工资数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <CalendarDays class="w-5 h-5 mr-2 text-primary" /> 参保与生育情形
        </h2>

        <!-- 单位月均缴费工资 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">单位上年度月平均缴费工资</label>
          <div class="flex items-center gap-2">
            <input
              v-model.number="avgSalary"
              type="number"
              min="0"
              step="100"
              placeholder="如 9000"
              class="flex-1 min-w-0 px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span class="text-xs text-muted-foreground flex-shrink-0">元 / 月</span>
          </div>
          <p class="text-xs text-red-500/90 leading-relaxed mt-1.5 flex items-start gap-1">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>不是个人工资！是单位参保职工的月均缴费基数，可在单位人事或社保 APP 查。</span>
          </p>
        </div>

        <!-- 所在城市 + 奖励假（可编辑） -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">所在城市 / 省份与奖励假</label>
          <div class="flex items-center gap-2">
            <select
              v-model="cityId"
              @change="onCityChange"
              class="flex-shrink-0 px-2.5 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="所在城市或省份"
            >
              <option v-for="p in PROVINCE_LEAVE_DAYS" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <input
              v-model.number="rewardDays"
              type="number"
              min="0"
              max="280"
              step="1"
              class="flex-1 min-w-0 px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="当地奖励假天数"
            />
            <span class="text-xs text-muted-foreground flex-shrink-0">天奖励假</span>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed mt-1.5 flex items-start gap-1">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>以当地人口与计划生育条例最新版为准，此处为常见量级；切换省份自动带入常见值，可手动修改。</span>
          </p>
          <p class="text-[10px] text-muted-foreground/80 leading-relaxed mt-1">{{ activeProvince.note }}</p>
        </div>

        <!-- 生育情形多选 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">生育情形</label>
          <div class="space-y-2">
            <div class="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/40">
              <input type="checkbox" checked disabled class="w-4 h-4 accent-primary" aria-label="顺产基础 98 天" />
              <span class="text-sm text-foreground">顺产（基础 98 天）</span>
              <span class="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">固定计入</span>
            </div>
            <label class="flex items-center gap-2 p-2.5 rounded-lg border border-border cursor-pointer hover:bg-muted/40">
              <input v-model="difficult" type="checkbox" class="w-4 h-4 accent-primary" />
              <span class="text-sm text-foreground">难产 / 剖宫产（+15 天）</span>
            </label>
            <div class="flex items-center gap-2 p-2.5 rounded-lg border border-border">
              <label class="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                <input v-model="multiplesEnabled" type="checkbox" class="w-4 h-4 accent-primary" />
                <span class="text-sm text-foreground">多胞胎（每多 1 婴 +15 天）</span>
              </label>
              <template v-if="multiplesEnabled">
                <input
                  v-model.number="multiplesCount"
                  type="number"
                  min="2"
                  max="10"
                  step="1"
                  class="w-16 px-2 py-1 bg-background border border-border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="婴儿总数"
                />
                <span class="text-xs text-muted-foreground flex-shrink-0">婴</span>
              </template>
            </div>
          </div>
          <p class="text-xs leading-relaxed mt-2 p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>基础 98 天中已含产前可休的 15 天（产前 15 天 + 产后 83 天），产前请假无需单独勾选或申报。</span>
          </p>
        </div>

        <!-- 个人月工资（选填） -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">个人月工资（选填，用于就高对比）</label>
          <div class="flex items-center gap-2">
            <input
              v-model.number="personalSalary"
              type="number"
              min="0"
              step="100"
              placeholder="如 15000"
              class="flex-1 min-w-0 px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span class="text-xs text-muted-foreground flex-shrink-0">元 / 月</span>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed mt-1.5 flex items-start gap-1">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>填入后自动对比「生育津贴 vs 产假工资」并计算补差金额；仅在本页内存中参与计算，不保存、不上传。</span>
          </p>
        </div>

        <!-- 操作 -->
        <div class="grid grid-cols-2 gap-2 pt-1">
          <button
            @click="loadExample"
            class="px-3 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition"
          >
            载入示例
          </button>
          <button
            @click="resetAll"
            class="px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1 -mt-0.5" /> 重置
          </button>
        </div>
      </div>

      <!-- 右侧：测算结果（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 津贴测算结果
          </h2>
          <span v-if="canCalc" class="text-xs text-muted-foreground hidden sm:block">{{ cityName }} · 奖励假 {{ rewardSafe }} 天</span>
        </div>

        <template v-if="canCalc">
          <!-- 结论卡：总产假天数 / 津贴金额 / 相当于几个月工资 -->
          <div class="bg-primary/10 rounded-lg p-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
              <div>
                <p class="text-xs text-muted-foreground mb-1">总产假天数</p>
                <p class="text-2xl sm:text-3xl font-bold text-primary">{{ daysExpr }}</p>
                <p class="text-xs text-muted-foreground mt-1">基础产假 + 难产 / 多胞胎加项 + 奖励假</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-1">生育津贴（估算）</p>
                <p class="text-2xl sm:text-3xl font-bold text-primary">¥{{ fmtMoney(allowance) }}</p>
                <p class="text-xs text-muted-foreground mt-1">单位月均缴费工资 {{ fmtMoney(avgSalaryNum) }} 元 / 月</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-1">相当于工资</p>
                <p class="text-2xl sm:text-3xl font-bold text-primary">{{ coverage }} 个月</p>
                <p class="text-xs text-muted-foreground mt-1">{{ coverageRefText }}</p>
              </div>
            </div>
          </div>

          <!-- 明细公式行 -->
          <div class="border border-border rounded-lg p-3 bg-muted/40">
            <p class="text-xs text-muted-foreground mb-1">明细公式（按月折日统一按 30 天）</p>
            <p class="text-sm font-mono text-foreground leading-relaxed">
              生育津贴 = 单位月均缴费工资 ÷ 30 × 产假天数<br />
              = {{ fmtMoney(avgSalaryNum) }} ÷ 30 × {{ totalDays }} = {{ fmtMoney(allowance) }} 元
            </p>
          </div>

          <!-- 加项明细表 -->
          <div class="border border-border rounded-lg overflow-hidden">
            <div class="px-4 py-2.5 bg-muted/40 border-b border-border">
              <p class="text-sm font-semibold text-foreground">产假天数加项明细</p>
            </div>
            <table class="w-full text-sm">
              <thead>
                <tr class="text-xs text-muted-foreground border-b border-border">
                  <th class="px-4 py-2 text-left font-medium">项目</th>
                  <th class="px-4 py-2 text-left font-medium">说明</th>
                  <th class="px-4 py-2 text-right font-medium">天数</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in detailRows"
                  :key="row.label"
                  class="border-b border-border/40 last:border-0"
                  :class="row.active ? '' : 'opacity-60'"
                >
                  <td class="px-4 py-2 text-foreground align-top">{{ row.label }}</td>
                  <td class="px-4 py-2 text-muted-foreground align-top">{{ row.note }}</td>
                  <td class="px-4 py-2 text-right font-mono whitespace-nowrap align-top" :class="row.active ? 'text-primary font-semibold' : 'text-muted-foreground'">
                    {{ row.days > 0 ? '+' + row.days + ' 天' : '0 天' }}
                  </td>
                </tr>
                <tr class="bg-muted/30">
                  <td class="px-4 py-2 text-foreground font-semibold">合计</td>
                  <td></td>
                  <td class="px-4 py-2 text-right font-mono font-bold text-primary whitespace-nowrap">{{ totalDays }} 天</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 就高对比卡（填了个人工资时显示） -->
          <div v-if="personalSalaryNum > 0" class="border border-border rounded-lg p-4 space-y-3">
            <p class="text-sm font-semibold text-foreground">生育津贴 vs 产假工资（就高发放，不重复享受）</p>
            <div class="grid grid-cols-2 gap-3 text-center">
              <div class="bg-muted/40 rounded-lg p-3">
                <p class="text-xs text-muted-foreground mb-1">生育津贴（基金拨付）</p>
                <p class="text-xl font-bold text-primary">¥{{ fmtMoney(allowance) }}</p>
              </div>
              <div class="bg-muted/40 rounded-lg p-3">
                <p class="text-xs text-muted-foreground mb-1">产假工资总额（单位应付）</p>
                <p class="text-xl font-bold text-foreground">¥{{ fmtMoney(comparison.salaryTotal) }}</p>
              </div>
            </div>
            <p v-if="comparison.better === 'allowance'" class="text-xs leading-relaxed p-2.5 rounded bg-green-500/10 text-green-600 flex items-start gap-1.5">
              <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>津贴更高，差额无需补：生育保险基金拨付的津贴归个人、由单位代发，产假期间单位可不再另行发放工资。</span>
            </p>
            <p v-else-if="comparison.better === 'salary'" class="text-xs leading-relaxed p-2.5 rounded bg-yellow-500/10 text-foreground flex items-start gap-1.5">
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>工资更高，单位需补差 {{ fmtMoney(comparison.supplement) }} 元：津贴（就低部分）归单位，低于你产假工资总额的差额由单位补足给个人。</span>
            </p>
            <p v-else class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
              <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>两者相等：按生育津贴口径发放即可，无需补差。</span>
            </p>
          </div>

          <!-- 流程提示卡（静态） -->
          <div class="border border-border rounded-lg p-4 bg-muted/30 space-y-2.5">
            <p class="text-sm font-semibold text-foreground">申报流程提示</p>
            <p class="text-xs leading-relaxed text-muted-foreground flex items-start gap-1.5">
              <CalendarDays class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span><b class="text-foreground">申报时限：</b>多数地区要求产后 12 个月内申报（部分城市为 9 个月或 1 年），逾期可能视为放弃，建议产后尽快办理。</span>
            </p>
            <p class="text-xs leading-relaxed text-muted-foreground flex items-start gap-1.5">
              <CheckCircle class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span><b class="text-foreground">材料清单：</b>婴儿出生医学证明、生育服务证（生育登记服务单）、医院发票 / 出院小结、夫妻身份证与银行账户等，以参保地要求为准。</span>
            </p>
            <p class="text-xs leading-relaxed text-muted-foreground flex items-start gap-1.5">
              <TriangleAlert class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span><b class="text-foreground">由单位申报，个人不能自行申报：</b>由用人单位向参保地医保 / 社保经办机构提交，津贴先拨付给单位、再转付个人。</span>
            </p>
          </div>

          <!-- 各地速查表 -->
          <div class="border border-border rounded-lg overflow-hidden">
            <div class="px-4 py-2.5 bg-muted/40 border-b border-border">
              <p class="text-sm font-semibold text-foreground">各省产假天数速查（点击行可快速选择）</p>
            </div>
            <table class="w-full text-sm">
              <thead>
                <tr class="text-xs text-muted-foreground border-b border-border">
                  <th class="px-4 py-2 text-left font-medium">省 / 市</th>
                  <th class="px-4 py-2 text-right font-medium">基础</th>
                  <th class="px-4 py-2 text-right font-medium">奖励假</th>
                  <th class="px-4 py-2 text-right font-medium">合计</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="p in PROVINCE_LEAVE_DAYS"
                  :key="p.id"
                  class="cursor-pointer border-b border-border/40 last:border-0"
                  :class="p.id === cityId ? 'bg-primary/10' : 'hover:bg-muted/40'"
                  @click="selectCity(p.id)"
                >
                  <td class="px-4 py-2">
                    <span class="font-medium" :class="p.id === cityId ? 'text-primary' : 'text-foreground'">{{ p.name }}</span>
                    <span v-if="p.id === cityId" class="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground align-middle">当前</span>
                    <p class="text-[10px] text-muted-foreground hidden sm:block">{{ p.note }}</p>
                  </td>
                  <td class="px-4 py-2 text-right font-mono text-muted-foreground">98</td>
                  <td class="px-4 py-2 text-right font-mono text-muted-foreground">+{{ p.reward }}</td>
                  <td class="px-4 py-2 text-right font-mono font-medium text-foreground">{{ baseDaysOf() + p.reward }}</td>
                </tr>
              </tbody>
            </table>
            <p class="px-4 py-2.5 text-[10px] text-muted-foreground border-t border-border leading-relaxed">
              数值为常见奖励假量级（部分省份条例按合计天数表述，已折算为 98 + 奖励假），以当地人口与计划生育条例最新版为准。
            </p>
          </div>
        </template>

        <!-- 输入不完整时的空状态 -->
        <div v-else class="text-center text-muted-foreground py-16">
          <TriangleAlert class="w-10 h-10 mx-auto mb-3 text-yellow-500" />
          <p class="text-sm">请先完善左侧输入：{{ inputErrors.join('；') }}。</p>
          <p class="text-xs text-muted-foreground/70 mt-1">也可以点击「载入示例」先看一条完整测算：单位月均缴费工资 9,000 元、上海（奖励假 60 天）、顺产 → 产假 158 天，津贴 = 9,000 ÷ 30 × 158 = 47,400 元。</p>
        </div>
      </div>
    </div>

    <!-- 免责声明（页面固定） -->
    <p class="text-xs text-muted-foreground leading-relaxed mb-8 flex items-start gap-1.5">
      <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
      <span>生育津贴按用人单位上年度月平均缴费工资计发（非个人工资），各地申报流程与时限不同；本工具按公开政策口径估算，以参保地医保/社保经办机构核定为准。</span>
    </p>

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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>生育津贴怎么算？</h2>
        <p class="text-sm text-muted-foreground mb-3 leading-relaxed">
          生育津贴计算器用于估算参保女职工产假期间由生育保险基金发放的津贴金额，核心公式只有一条：
          <b class="text-foreground">生育津贴 = 单位上年度月平均缴费工资 ÷ 30 × 产假天数</b>。逐词拆开看：
        </p>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground mb-4">
          <li>「单位上年度月平均缴费工资」：用人单位全体参保职工的月平均缴费基数，<b class="text-foreground">不是你个人的工资</b>；</li>
          <li>「÷ 30」：按月折日的通行口径（个别地区按 30.4 天或当月实际天数折算，以参保地经办口径为准）；</li>
          <li>「产假天数」：基础 98 天 + 各省奖励假 + 难产 / 多胞胎加项，详见下方「产假多少天」。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么用单位平均工资，而不是我的工资？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          生育保险费由用人单位按职工工资总额缴纳，个人不缴费；津贴由医保经办机构按<b class="text-foreground">单位月平均缴费基数</b>一次性拨付给单位，
          再由单位转付个人，所以计发基数天然是「单位口径」。如果个人工资高于单位平均基数，按「就高」原则由单位补足差额（见下文补差规则），
          工资高的人不会因单位基数低而吃亏；反之津贴高于工资时，津贴全额归个人。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">产假多少天？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-3">
          全国统一的基础产假为 <b class="text-foreground">98 天</b>（其中产前可以休 15 天），来自国务院《女职工劳动保护特别规定》第 7 条；
          各省《人口与计划生育条例》在此基础上叠加奖励假（常见 60–90 天），难产（剖宫产等）另加 15 天、多胞胎每多生育 1 个婴儿加 15 天。
          所以「生个孩子到底休多少天」完全取决于所在省份：
        </p>
        <div class="border border-border rounded-lg overflow-hidden mb-3">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-xs text-muted-foreground border-b border-border bg-muted/40">
                <th class="px-4 py-2 text-left font-medium">省 / 市</th>
                <th class="px-4 py-2 text-right font-medium">产假合计</th>
                <th class="px-4 py-2 text-left font-medium">口径备注</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in PROVINCE_LEAVE_DAYS" :key="'seo-' + p.id" class="border-b border-border/40 last:border-0">
                <td class="px-4 py-2 text-foreground font-medium whitespace-nowrap">{{ p.name }}</td>
                <td class="px-4 py-2 text-right font-mono text-foreground whitespace-nowrap">{{ baseDaysOf() + p.reward }} 天</td>
                <td class="px-4 py-2 text-muted-foreground">{{ p.note }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-xs text-muted-foreground leading-relaxed">
          表中数值为常见量级：浙江、四川、湖北、湖南、山东、陕西等省条例直接按「产假 158 天」合并口径表述（即 98 + 60）；
          河南奖励假按「3 个月」表述、津贴按 90 天口径估算；福建各地执行 158–180 天。奖励假天数以当地人口与计划生育条例最新版为准。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">生育津贴和产假工资能同时拿吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          不能重复享受，按「就高」原则执行：生育津贴高于产假工资的，津贴全额归个人、由单位代发，单位可不再另发工资；
          产假工资高于生育津贴的，津贴（就低部分）归单位，<b class="text-foreground">差额由单位补发给个人</b>——补差 = 产假工资总额 − 津贴。
          在上方填入个人月工资，工具会自动比较并算出补差金额。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">流产有津贴吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          有。怀孕未满 4 个月流产的享受 15 天产假、满 4 个月流产的享受 42 天产假（《女职工劳动保护特别规定》第 7 条第二款），同样按生育津贴口径计发。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">男方有陪产假津贴吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          多数省份给男方 15 天左右的陪产假（护理假），假期工资按护理假津贴口径由生育保险支付或由单位照发，各省天数与申报口径不同，以当地条例和经办机构答复为准。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">去哪里申报？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          由用人单位向参保地医保 / 社保经办机构申报（线上多走当地医保 APP、政务服务网，线下为经办窗口），个人一般不能自行申报、只需配合提供材料；
          多数地区要求产后 12 个月内申报，逾期可能视为放弃。所需材料通常包括婴儿出生医学证明、生育服务证、医院发票与出院小结等。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">生育津贴怎么计算？</h3>
            <p class="text-sm text-muted-foreground mt-1">生育津贴 = 单位上年度月平均缴费工资 ÷ 30 × 产假天数。计发基数是单位全体参保职工的月平均缴费基数而非个人工资；产假天数为 98 天基础产假加各省奖励假（常见 60–90 天），难产另加 15 天、多胞胎每多一婴加 15 天。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">产假多少天？</h3>
            <p class="text-sm text-muted-foreground mt-1">基础产假 98 天（含产前可休的 15 天）；叠加各省奖励假后合计常见为 158 天（上海、北京、江苏、浙江、四川、湖北、湖南、山东、陕西等），广东 178 天、河南 188 天、福建 158–180 天；难产另加 15 天、多胞胎每多一婴加 15 天，以当地人口与计划生育条例最新版为准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">生育津贴和产假工资能同时拿吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不能重复享受，按「就高」原则执行：津贴高于产假工资的，津贴归个人由单位代发；产假工资高于津贴的，津贴归单位、差额（工资总额 − 津贴）由单位补发给个人。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">流产有生育津贴吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">有。怀孕未满 4 个月流产的享受 15 天产假、满 4 个月流产的享受 42 天产假，同样按生育津贴口径计发。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">男方有陪产假津贴吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">多数省份给男方 15 天左右陪产假（护理假），假期工资按护理假津贴口径由生育保险支付或由单位照发，各省天数与口径不同，以当地条例为准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">生育津贴去哪里申报？</h3>
            <p class="text-sm text-muted-foreground mt-1">由用人单位向参保地医保或社保经办机构申报（个人一般不能自行申报），多数地区要求产后 12 个月内办理，需准备婴儿出生医学证明、生育服务证、医院发票等材料。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'maternity-allowance-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Baby, Calculator, CheckCircle, TriangleAlert, ChevronUp, ChevronDown,
  Info, RefreshCw, CalendarDays
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '生育津贴计算器 - 产假天数与生育津贴金额在线计算',
  description: '免费在线生育津贴计算器：输入单位上年度月平均缴费工资与所在省份，按基础 98 天 + 各地奖励假 + 难产/多胞胎加项自动合计产假天数，估算生育津贴金额，对比津贴与产假工资就高发放与补差，附各省产假天数速查表与申报流程材料清单，纯浏览器本地计算不上传',
  keywords: '生育津贴计算器,产假多少天,生育津贴怎么算,顺产难产产假,各地产假标准',
  author: '有条工具',
  ogTitle: '生育津贴计算器 - 产假天数与生育津贴金额在线计算 | 有条工具',
  ogDescription: '98 天基础产假 + 各地奖励假自动合计，津贴与产假工资就高对比，各省产假标准速查。',
  ogUrl: 'https://www.util.cn/tools/maternity-allowance-calculator',
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
          name: '生育津贴计算器',
          url: 'https://www.util.cn/tools/maternity-allowance-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['按单位月均缴费工资估算生育津贴', '98 天基础产假与各省奖励假自动叠加', '难产与多胞胎加项计算', '津贴与产假工资就高对比及补差金额', '各省产假天数速查表', '申报时限与材料清单提示', '纯浏览器本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '生育津贴计算器', item: 'https://www.util.cn/tools/maternity-allowance-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '生育津贴怎么计算？',
              acceptedAnswer: { '@type': 'Answer', text: '生育津贴 = 单位上年度月平均缴费工资 ÷ 30 × 产假天数。计发基数是单位全体参保职工的月平均缴费基数而非个人工资；产假天数为 98 天基础产假加各省奖励假（常见 60–90 天），难产另加 15 天、多胞胎每多一婴加 15 天。' }
            },
            {
              '@type': 'Question',
              name: '产假多少天？',
              acceptedAnswer: { '@type': 'Answer', text: '基础产假 98 天（含产前可休的 15 天）；叠加各省奖励假后合计常见为 158 天（上海、北京、江苏、浙江、四川、湖北、湖南、山东、陕西等），广东 178 天、河南 188 天、福建 158–180 天；难产另加 15 天、多胞胎每多一婴加 15 天，以当地人口与计划生育条例最新版为准。' }
            },
            {
              '@type': 'Question',
              name: '生育津贴和产假工资能同时拿吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不能重复享受，按就高原则执行：津贴高于产假工资的，津贴归个人由单位代发；产假工资高于津贴的，津贴归单位、差额（工资总额减津贴）由单位补发给个人。' }
            },
            {
              '@type': 'Question',
              name: '流产有生育津贴吗？',
              acceptedAnswer: { '@type': 'Answer', text: '有。怀孕未满 4 个月流产的享受 15 天产假、满 4 个月流产的享受 42 天产假，同样按生育津贴口径计发。' }
            },
            {
              '@type': 'Question',
              name: '男方有陪产假津贴吗？',
              acceptedAnswer: { '@type': 'Answer', text: '多数省份给男方 15 天左右陪产假（护理假），假期工资按护理假津贴口径由生育保险支付或由单位照发，各省天数与口径不同，以当地条例为准。' }
            },
            {
              '@type': 'Question',
              name: '生育津贴去哪里申报？',
              acceptedAnswer: { '@type': 'Answer', text: '由用人单位向参保地医保或社保经办机构申报（个人一般不能自行申报），多数地区要求产后 12 个月内办理，需准备婴儿出生医学证明、生育服务证、医院发票等材料。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------

// 保留 2 位小数（规避浮点误差：Math.round(x*100)/100）
function round2(x) {
  return Math.round(x * 100) / 100
}

// 金额入参收敛：非有限数值或 ≤0 按 0 处理
function moneyOf(v) {
  const n = Number(v)
  return isFinite(n) && n > 0 ? n : 0
}

// 天数入参收敛：非有限数值或 <0 按 0 处理（向下取整）
function daysOf(v) {
  const n = Math.floor(Number(v))
  return isFinite(n) && n > 0 ? n : 0
}

// 金额展示：千分位 + 固定 2 位小数（手工实现，避免 SSR 与浏览器 locale 差异导致 hydration 不一致）
function fmtMoney(n) {
  const v = round2(Number(n) || 0)
  const sign = v < 0 ? '-' : ''
  const parts = Math.abs(v).toFixed(2).split('.')
  return sign + parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + parts[1]
}

// 基础产假天数：国务院《女职工劳动保护特别规定》第 7 条，顺产 98 天（其中产前可休 15 天）
const BASE_DAYS = 98
function baseDaysOf() {
  return BASE_DAYS
}

const DIFFICULT_EXTRA = 15 // 难产（剖宫产、产钳助产等）加项
const MULTIPLE_EXTRA = 15  // 多胞胎加项：每多生育 1 个婴儿

// 法定产假天数 = 98 + (难产 ? 15 : 0) + 15 × (multiples - 1)（multiples ≥ 1 时生效）。
// multiples 为婴儿总数：单胞胎传 1（不加项），双胞胎传 2（+15），<1 视为 1。
// 各省奖励假不在此函数内，由 leaveDaysOf 单独叠加。
function totalDaysOf({ difficult = false, multiples = 1 } = {}) {
  const n = Math.floor(Number(multiples))
  const babies = isFinite(n) && n >= 1 ? n : 1
  return baseDaysOf() + (difficult ? DIFFICULT_EXTRA : 0) + MULTIPLE_EXTRA * (babies - 1)
}

// 总产假天数 = 法定产假 + 各省奖励假（可编辑，常见 60–90 天）
function leaveDaysOf({ difficult = false, multiples = 1, reward = 0 } = {}) {
  return totalDaysOf({ difficult, multiples }) + daysOf(reward)
}

// 生育津贴 = 单位上年度月平均缴费工资 ÷ 30 × 产假天数，保留 2 位小数。
// 「÷ 30」为按月折日的通行口径（个别地区按 30.4 或当月实际天数，以参保地经办口径为准）。
function allowanceOf(monthlyAvgSalary, days) {
  return Math.round((moneyOf(monthlyAvgSalary) / 30) * daysOf(days) * 100) / 100
}

// 就高对比：生育津贴与产假工资不重复享受，按「就高」口径执行（就低补差规则）：
// - 津贴 ≥ 产假工资总额：基金拨付的津贴全额归个人、由单位代发，单位无需再另付工资；
// - 产假工资总额 > 津贴：津贴（就低部分）归单位，差额由单位补足给个人，
//   补差 = 产假工资总额 − 津贴（工资总额按同一口径折日：月工资 ÷ 30 × 产假天数）。
// 产假工资入参无效（≤0 或天数为 0）时按 salaryTotal=0 处理，页面仅在填入有效工资后展示对比卡。
function compareWithSalaryOf(allowance, monthlySalary, days) {
  const a = Number(allowance) || 0
  const s = moneyOf(monthlySalary)
  const d = daysOf(days)
  const salaryTotal = s > 0 && d > 0 ? Math.round((s / 30) * d * 100) / 100 : 0
  if (a > salaryTotal) return { better: 'allowance', salaryTotal, supplement: 0 }
  if (a < salaryTotal) return { better: 'salary', salaryTotal, supplement: round2(salaryTotal - a) }
  return { better: 'equal', salaryTotal, supplement: 0 }
}

// 津贴相当于几个月的参考工资（1 位小数；参考工资 ≤0 时返回 0）
function monthCoverageOf(allowance, monthlySalary) {
  const a = Number(allowance) || 0
  const s = Number(monthlySalary) || 0
  if (s <= 0) return 0
  return Math.round((a / s) * 10) / 10
}

// 各省奖励假速查：数值为常见奖励假天数（量级参考，非实时），页面内全部可编辑。
// 浙江/四川/湖北/湖南/山东/陕西等省条例按「产假 158 天」合并口径表述，此处统一折算为 98 + 奖励 60；
// 河南奖励假按「3 个月」表述，津贴按 90 天口径估算；福建各地执行 158–180 天，此处取常见下限。
const PROVINCE_LEAVE_DAYS = [
  { id: 'guangdong', name: '广东', reward: 80, note: '奖励假 80 天' },
  { id: 'shanghai', name: '上海', reward: 60, note: '生育假 60 天' },
  { id: 'beijing', name: '北京', reward: 60, note: '奖励假 60 天' },
  { id: 'jiangsu', name: '江苏', reward: 60, note: '奖励假 60 天，难产另加 15 天' },
  { id: 'zhejiang', name: '浙江', reward: 60, note: '条例按「产假 158 天」合并口径表述（98 + 60）' },
  { id: 'sichuan', name: '四川', reward: 60, note: '条例按合计 158 天口径表述（98 + 60）' },
  { id: 'hubei', name: '湖北', reward: 60, note: '合计 158 天（98 + 60）' },
  { id: 'hunan', name: '湖南', reward: 60, note: '合计 158 天（98 + 60）' },
  { id: 'shandong', name: '山东', reward: 60, note: '合计 158 天（98 + 60）' },
  { id: 'henan', name: '河南', reward: 90, note: '奖励假按「3 个月」表述，津贴按 90 天口径估算，合计 188 天' },
  { id: 'shaanxi', name: '陕西', reward: 60, note: '合计 158 天（98 + 60）' },
  { id: 'fujian', name: '福建', reward: 60, note: '各地执行 158–180 天，此处取常见下限' },
  { id: 'custom', name: '自定义', reward: 60, note: '自行输入当地奖励假天数' }
]

function provinceOf(id) {
  return PROVINCE_LEAVE_DAYS.find((p) => p.id === id) || PROVINCE_LEAVE_DAYS[0]
}

// ---------- 页面状态 ----------
const avgSalary = ref('')           // 单位上年度月平均缴费工资（敏感，不持久化）
const cityId = ref('guangdong')     // 所在省份（仅此项写入 localStorage）
const rewardDays = ref(80)          // 当地奖励假天数（可编辑）
const difficult = ref(false)        // 难产 / 剖宫产
const multiplesEnabled = ref(false) // 多胞胎
const multiplesCount = ref(2)       // 婴儿总数（≥2）
const personalSalary = ref('')      // 个人月工资（选填，敏感，不持久化）
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 输入收敛与校验 ----------
const avgSalaryNum = computed(() => moneyOf(avgSalary.value))
const personalSalaryNum = computed(() => moneyOf(personalSalary.value))
const rewardSafe = computed(() => daysOf(rewardDays.value))
const multiplesSafe = computed(() => {
  if (!multiplesEnabled.value) return 1
  const n = Math.floor(Number(multiplesCount.value))
  return isFinite(n) && n >= 2 ? Math.min(n, 10) : 2
})

const inputErrors = computed(() => {
  const errs = []
  if (!(Number(avgSalary.value) > 0)) errs.push('单位上年度月平均缴费工资需大于 0')
  return errs
})

const canCalc = computed(() => inputErrors.value.length === 0)

// ---------- 计算与展示派生 ----------
const activeProvince = computed(() => provinceOf(cityId.value))
const cityName = computed(() => activeProvince.value.name)

const statutoryDays = computed(() => totalDaysOf({ difficult: difficult.value, multiples: multiplesSafe.value }))
const totalDays = computed(() => leaveDaysOf({ difficult: difficult.value, multiples: multiplesSafe.value, reward: rewardSafe.value }))
const allowance = computed(() => allowanceOf(avgSalaryNum.value, totalDays.value))
const comparison = computed(() => compareWithSalaryOf(allowance.value, personalSalaryNum.value, totalDays.value))

const coverage = computed(() => {
  const reference = personalSalaryNum.value > 0 ? personalSalaryNum.value : avgSalaryNum.value
  return monthCoverageOf(allowance.value, reference)
})
const coverageRefText = computed(() => (personalSalaryNum.value > 0 ? '按个人月工资折算' : '按单位月均缴费工资折算'))

// 加项明细表：基础 / 难产 / 多胞胎 / 奖励假逐行，未勾选的行置灰显示 0
const detailRows = computed(() => {
  const m = multiplesSafe.value
  return [
    {
      label: '基础产假（顺产，含产前 15 天）',
      days: baseDaysOf(),
      note: '《女职工劳动保护特别规定》第 7 条',
      active: true
    },
    {
      label: '难产 / 剖宫产',
      days: difficult.value ? DIFFICULT_EXTRA : 0,
      note: difficult.value ? '剖宫产、产钳助产等难产加 15 天' : '未勾选，不计入',
      active: difficult.value
    },
    {
      label: `多胞胎（婴儿 ${m} 个）`,
      days: m >= 2 ? MULTIPLE_EXTRA * (m - 1) : 0,
      note: m >= 2 ? `每多 1 婴加 15 天 × ${m - 1}` : '未勾选，不计入',
      active: m >= 2
    },
    {
      label: `奖励假（${cityName.value}）`,
      days: rewardSafe.value,
      note: '以当地人口与计划生育条例最新版为准',
      active: rewardSafe.value > 0
    }
  ]
})

// 「98 + 60 = 158 天」式构成表达式（仅列非零项）
const daysExpr = computed(() => {
  const nums = detailRows.value.filter((r) => r.days > 0).map((r) => r.days)
  return `${nums.join(' + ')} = ${totalDays.value} 天`
})

// 明细公式代入文本：9,000.00 ÷ 30 × 158 = 47,400.00 元
const formulaText = computed(() => `${fmtMoney(avgSalaryNum.value)} ÷ 30 × ${totalDays.value} = ${fmtMoney(allowance.value)} 元`)

// ---------- 城市切换与本地偏好 ----------
function onCityChange() {
  const p = provinceOf(cityId.value)
  if (p.id !== 'custom') rewardDays.value = p.reward // 自定义保留当前输入
}

function selectCity(id) {
  cityId.value = id
  onCityChange()
}

// 本地偏好：仅记忆省份选择（非敏感信息）；工资相关输入一律不写入 localStorage
const PREF_KEY = 'util-maternity-allowance-prefs'

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    if (!raw) return
    const prefs = JSON.parse(raw)
    if (prefs && typeof prefs.cityId === 'string' && PROVINCE_LEAVE_DAYS.some((p) => p.id === prefs.cityId)) {
      cityId.value = prefs.cityId
      onCityChange()
    }
  } catch (e) {
    // 隐私模式 / 存储被禁用 / JSON 损坏时忽略，页面功能不受影响
  }
}

function savePrefs() {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify({ cityId: cityId.value }))
  } catch (e) {
    // 写入失败（配额、隐私模式）不影响计算
  }
}

watch(cityId, () => { savePrefs() })

// ---------- 示例与重置 ----------
function loadExample() {
  avgSalary.value = 9000
  cityId.value = 'shanghai'
  rewardDays.value = 60
  difficult.value = false
  multiplesEnabled.value = false
  multiplesCount.value = 2
  personalSalary.value = ''
}

function resetAll() {
  avgSalary.value = ''
  cityId.value = 'guangdong'
  rewardDays.value = 80
  difficult.value = false
  multiplesEnabled.value = false
  multiplesCount.value = 2
  personalSalary.value = ''
}

onMounted(() => {
  loadPrefs()
  addRecentTool('maternity-allowance-calculator')
})
</script>
