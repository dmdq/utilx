<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <CheckSquare class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">考勤计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">应出勤 / 实出勤 / 迟到 / 事假病假旷工多因子核算当月工资，21.75 计薪口径，扣款法与正算法双口径对比</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线考勤计算器（出勤工资核算工具）：输入月工资与当月应出勤 / 实出勤天数、迟到累计分钟、事假 / 病假 / 旷工天数，
        按<b>日工资 = 月薪 ÷ 21.75</b>（月计薪天数现行折算口径）同时按两种实务口径核算应发工资——
        <b>扣款法（反算）</b>：月薪 − 事假 / 病假 / 旷工 / 迟到各项扣款；
        <b>正算法</b>：日工资 × 实出勤 + 病假工资 − 迟到扣款，两口径差异与「对劳动者更有利」裁审原则并列展示；
        病假按单位制度比例折算（法规只托底不低于最低工资 80%），支持当地最低工资下限红标校验。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <CheckSquare class="w-5 h-5 mr-2 text-primary" /> 考勤与工资信息
        </h2>

        <!-- 月工资 -->
        <div>
          <label for="att-wage" class="block text-sm font-medium text-foreground mb-2">月工资（正常出勤口径）</label>
          <div class="flex items-center gap-2">
            <input
              id="att-wage"
              v-model.number="monthlyWage"
              type="number"
              min="0"
              step="100"
              placeholder="如 8700"
              class="flex-1 min-w-0 px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span class="text-xs text-muted-foreground flex-shrink-0">元 / 月</span>
          </div>
        </div>

        <!-- 年月与应出勤 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">当月应出勤天数</label>
          <div class="grid grid-cols-3 gap-2">
            <select
              v-model="year"
              aria-label="年份"
              class="w-full px-2 py-2 border border-border bg-background rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">年</option>
              <option v-for="y in YEAR_OPTIONS" :key="y" :value="y">{{ y }} 年</option>
            </select>
            <select
              v-model="month"
              aria-label="月份"
              class="w-full px-2 py-2 border border-border bg-background rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">月</option>
              <option v-for="m in 12" :key="m" :value="m">{{ m }} 月</option>
            </select>
            <input
              id="att-expected"
              v-model.number="expectedDays"
              type="number"
              min="0"
              max="31"
              step="1"
              aria-label="应出勤天数"
              class="w-full px-2 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed mt-1.5 flex items-start gap-1">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>选年月后自动填入「当月去掉双休日」的工作日参考值（不含法定节假日，逢节假日请手动减去）；全年平均月工作日口径为 20.67 天（2025 年起法定节假日 13 天），仅作排班参考、不用于工资折算。</span>
          </p>
        </div>

        <!-- 实出勤 -->
        <div>
          <label for="att-actual" class="block text-sm font-medium text-foreground mb-2">实出勤天数</label>
          <input
            id="att-actual"
            v-model.number="actualDays"
            type="number"
            min="0"
            max="31"
            step="1"
            placeholder="如 17"
            class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p v-if="attendanceGap !== 0" class="text-[11px] leading-relaxed mt-1 p-2 rounded bg-amber-500/10 text-amber-600 flex items-start gap-1">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>实出勤 + 各类缺勤（{{ attendanceGap >= 0 ? '多出' : '差' }} {{ Math.abs(attendanceGap) }} 天）与应出勤 {{ fmtNum(expectedNum) }} 天不一致，请核对是否漏填。</span>
          </p>
        </div>

        <!-- 迟到 -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="att-late-count" class="block text-sm font-medium text-foreground mb-2">迟到次数</label>
            <input
              id="att-late-count"
              v-model.number="lateCount"
              type="number"
              min="0"
              step="1"
              placeholder="如 3"
              class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label for="att-late-min" class="block text-sm font-medium text-foreground mb-2">累计迟到分钟</label>
            <input
              id="att-late-min"
              v-model.number="lateMinutes"
              type="number"
              min="0"
              step="5"
              placeholder="如 90"
              class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <p class="text-[11px] text-muted-foreground leading-relaxed -mt-2 flex items-start gap-1">
          <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
          <span>本页迟到扣款按「时薪 ÷ 60 × 累计分钟」教学口径折算（按缺勤时间扣），次数仅用于展示；迟到扣款以依法制定的规章制度为准，且扣除后当月工资不得低于当地最低工资标准。</span>
        </p>

        <!-- 假勤天数 -->
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label for="att-personal" class="block text-sm font-medium text-foreground mb-2">事假（天）</label>
            <input
              id="att-personal"
              v-model.number="personalLeaveDays"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label for="att-sick" class="block text-sm font-medium text-foreground mb-2">病假（天）</label>
            <input
              id="att-sick"
              v-model.number="sickLeaveDays"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label for="att-absent" class="block text-sm font-medium text-foreground mb-2">旷工（天）</label>
            <input
              id="att-absent"
              v-model.number="absenteeismDays"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <!-- 病假比例与最低工资 -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="att-sick-rate" class="block text-sm font-medium text-foreground mb-2">病假工资比例（%）</label>
            <input
              id="att-sick-rate"
              v-model.number="sickRatePct"
              type="number"
              min="0"
              max="100"
              step="10"
              placeholder="如 60"
              class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-[10px] text-muted-foreground/80 leading-relaxed mt-1">按单位制度填写（60 / 70 / 80 等常见档）；法规只托底「病假工资不低于最低工资 80%」。</p>
          </div>
          <div>
            <label for="att-minwage" class="block text-sm font-medium text-foreground mb-2">当地月最低工资（可选）</label>
            <input
              id="att-minwage"
              v-model.number="minWage"
              type="number"
              min="0"
              step="10"
              placeholder="留空跳过校验"
              class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-[10px] text-muted-foreground/80 leading-relaxed mt-1">应发低于该值时红标提示；以当地人社部门现行标准为准。</p>
          </div>
        </div>

        <!-- 输入校验 -->
        <p v-if="inputErrors.length" class="text-xs leading-relaxed text-red-500 p-2 rounded bg-red-500/10 flex items-start gap-1.5">
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ inputErrors.join('；') }}。</span>
        </p>

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

      <!-- 右侧：结果（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 当月工资测算结果
          </h2>
          <button
            v-if="canCalc"
            @click="copyResult"
            class="text-xs px-2.5 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-foreground transition"
          >
            <Copy class="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> 复制结果
          </button>
        </div>

        <template v-if="canCalc">
          <!-- 主结果卡：扣款法 -->
          <div class="bg-primary/10 rounded-lg p-5 text-center">
            <p class="text-xs text-muted-foreground mb-1">应发工资（扣款法 / 反算：月薪 − 各项扣款）</p>
            <p class="text-4xl sm:text-5xl font-bold leading-tight font-mono" :class="result.clamped ? 'text-red-600' : 'text-primary'">
              ¥{{ fmtMoney(result.payableDeduct) }}
            </p>
            <p class="text-xs text-muted-foreground mt-2">
              {{ fmtMoney(monthlyNum) }} − {{ fmtMoney(result.deducts.total) }}（事假 {{ fmtMoney(result.deducts.personal) }} + 病假 {{ fmtMoney(result.deducts.sick) }} + 旷工 {{ fmtMoney(result.deducts.absent) }} + 迟到 {{ fmtMoney(result.deducts.late) }}）
            </p>
            <p v-if="result.clamped" class="text-xs text-red-600 mt-1.5 font-medium">扣款合计超过月薪，应发按 0 计——实务中用人单位通常需另行处理，请以本单位制度与当地规定为准。</p>
          </div>

          <!-- 单价三卡 -->
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-muted/50 rounded-xl p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">日工资（÷21.75）</p>
              <p class="text-xl font-bold text-foreground font-mono">¥{{ fmtMoney(result.daily) }}</p>
              <p class="text-[11px] text-muted-foreground mt-1">{{ fmtMoney(monthlyNum) }} ÷ 21.75</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">时薪（÷8）</p>
              <p class="text-xl font-bold text-foreground font-mono">¥{{ fmtMoney(result.hourly) }}</p>
              <p class="text-[11px] text-muted-foreground mt-1">日工资 ÷ 8 小时</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">每分钟（迟到折算用）</p>
              <p class="text-xl font-bold text-foreground font-mono">¥{{ fmtMoney(result.perMinute) }}</p>
              <p class="text-[11px] text-muted-foreground mt-1">时薪 ÷ 60 × {{ fmtNum(Math.max(0, Number(lateMinutes) || 0)) }} 分钟 = ¥{{ fmtMoney(result.deducts.late) }}</p>
            </div>
          </div>

          <!-- 下限校验 -->
          <p
            v-if="minWageCheck.breached"
            class="text-xs leading-relaxed p-3 rounded-lg bg-red-500/10 text-red-600 border border-red-500/20 flex items-start gap-1.5"
          >
            <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              下限预警：测算应发 {{ fmtMoney(result.payableDeduct) }} 元已低于你填写的当地月最低工资 {{ fmtMoney(minWageCheck.floor) }} 元。
              扣款（尤其迟到 / 事假处理）后当月工资不得低于最低工资标准，且每月扣除部分一般不得超过当月工资的 20%（经济损失赔偿口径），请以当地规定与单位制度为准。
            </span>
          </p>
          <p
            v-else-if="!minWageCheck.skip"
            class="text-xs leading-relaxed p-3 rounded-lg bg-green-500/10 text-green-600 border border-green-500/20 flex items-start gap-1.5"
          >
            <CheckCircle class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>下限校验通过：测算应发 {{ fmtMoney(result.payableDeduct) }} 元 ≥ 当地月最低工资 {{ fmtMoney(minWageCheck.floor) }} 元。</span>
          </p>

          <!-- 正算法对比卡 -->
          <div class="border border-border rounded-lg p-4 bg-muted/30">
            <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
              <p class="text-sm font-semibold text-foreground">口径对比：正算法（按实际出勤）</p>
              <span class="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                两口径差 {{ fmtMoney(Math.abs(result.payablePositive - result.payableDeduct)) }} 元
              </span>
            </div>
            <p class="text-2xl font-bold text-foreground font-mono">¥{{ fmtMoney(result.payablePositive) }}</p>
            <p class="text-xs text-muted-foreground leading-relaxed mt-1.5">
              正算法 = 日工资 {{ fmtMoney(result.daily) }} × 实出勤 {{ fmtNum(actualNum) }} 天 + 病假工资 {{ fmtMoney(result.sickPay) }}（{{ fmtMoney(result.daily) }} × {{ fmtNum(sickNum) }} 天 × {{ fmtNum(sickRateNum) }}%）− 迟到 {{ fmtMoney(result.deducts.late) }}。
              扣款法与正算法在「应出勤 ≠ 21.75」的月份会出现差额——实务中存在争议，裁审机构多倾向<b class="text-foreground">选择对劳动者更有利的口径</b>（或取两者较高值），具体以当地裁审口径为准。
            </p>
          </div>

          <!-- 扣款明细表 -->
          <div>
            <h3 class="text-sm font-semibold text-foreground mb-2">各项扣款明细（教学演示口径）</h3>
            <div class="overflow-x-auto rounded-lg border border-border bg-background">
              <table class="w-full text-xs">
                <thead>
                  <tr class="text-muted-foreground border-b border-border bg-muted/40">
                    <th class="px-3 py-1.5 text-left font-medium">项目</th>
                    <th class="px-3 py-1.5 text-left font-medium">折算公式</th>
                    <th class="px-3 py-1.5 text-right font-medium">金额</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="border-b border-border/40 last:border-0">
                    <td class="px-3 py-1.5 text-foreground font-medium">事假扣款</td>
                    <td class="px-3 py-1.5 text-muted-foreground">日工资 × {{ fmtNum(personalNum) }} 天（事假通常不带薪）</td>
                    <td class="px-3 py-1.5 text-right font-mono text-foreground">−{{ fmtMoney(result.deducts.personal) }}</td>
                  </tr>
                  <tr class="border-b border-border/40 last:border-0">
                    <td class="px-3 py-1.5 text-foreground font-medium">病假扣款</td>
                    <td class="px-3 py-1.5 text-muted-foreground">月薪 × {{ fmtNum(sickNum) }} ÷ 21.75 ×（1 − {{ fmtNum(sickRateNum) }}%）</td>
                    <td class="px-3 py-1.5 text-right font-mono text-foreground">−{{ fmtMoney(result.deducts.sick) }}</td>
                  </tr>
                  <tr class="border-b border-border/40 last:border-0">
                    <td class="px-3 py-1.5 text-foreground font-medium">旷工扣款</td>
                    <td class="px-3 py-1.5 text-muted-foreground">日工资 × {{ fmtNum(absentNum) }} 天（单位加罚以依法制定的制度为准）</td>
                    <td class="px-3 py-1.5 text-right font-mono text-foreground">−{{ fmtMoney(result.deducts.absent) }}</td>
                  </tr>
                  <tr class="border-b border-border/40 last:border-0">
                    <td class="px-3 py-1.5 text-foreground font-medium">迟到扣款</td>
                    <td class="px-3 py-1.5 text-muted-foreground">时薪 ÷ 60 × {{ fmtNum(lateMinNum) }} 分钟（迟到共 {{ fmtNum(lateCountNum) }} 次）</td>
                    <td class="px-3 py-1.5 text-right font-mono text-foreground">−{{ fmtMoney(result.deducts.late) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <!-- 空状态 -->
        <div v-else class="text-center text-muted-foreground py-16">
          <TriangleAlert class="w-10 h-10 mx-auto mb-3 text-yellow-500" />
          <p class="text-sm">请先完善左侧输入：{{ inputErrors.join('；') }}。</p>
          <p class="text-xs text-muted-foreground/70 mt-1">也可以点击「载入示例」先看一条完整测算：月薪 8700 元、事假 2 天、病假 3 天（60%）、迟到 90 分钟。</p>
        </div>
      </div>
    </div>

    <!-- 口径与免责声明（页面固定） -->
    <div class="border border-border bg-muted/30 rounded-lg p-4 mb-8 flex items-start gap-2">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        计算依据：《关于职工全年月平均工作时间和工资折算问题的通知》（月计薪天数 21.75 天，原劳社部发〔2008〕3 号确立、2025 年 1 月 1 日起人社部同名新通知沿用，数值不变）；
        劳部发〔1995〕309 号第 59 条（病假工资不低于最低工资 80%）；《工资支付暂行规定》第 15、16 条（扣款限制）。
        各项扣款与比例为教学演示口径，<b class="text-foreground">以现行法规原文、当地规定与本单位依法制定的规章制度为准</b>；本工具仅供教育参考，不构成法律意见。
      </p>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="bg-card border border-border rounded-lg mb-12 group">
      <summary class="flex items-center justify-between cursor-pointer select-none px-6 py-4">
        <span class="text-lg font-semibold text-foreground"><span class="text-primary mr-2">#</span>21.75 口径、扣款规则与常见问题</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform" />
      </summary>
      <div class="px-6 pb-6 space-y-6">
        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">计算公式</h3>
          <div class="bg-muted/50 rounded-xl p-4 text-sm text-foreground leading-relaxed space-y-2">
            <p><strong>日工资</strong> = 月工资 ÷ 21.75（月计薪天数 =（365 − 104）÷ 12，节假日带薪不扣减，现行折算口径沿用自原劳社部发〔2008〕3 号、2025 年起人社部同名通知沿用，数值不变）。</p>
            <p><strong>时薪</strong> = 日工资 ÷ 8；<strong>每分钟</strong> = 时薪 ÷ 60。</p>
            <p><strong>事假扣款</strong> = 日工资 × 事假天数（事假不带薪是通行口径）；<strong>旷工扣款</strong> = 日工资 × 旷工天数，有的单位另设罚则以依法制定的规章制度为准。</p>
            <p><strong>病假扣款</strong> = 月薪 × 病假天数 ÷ 21.75 ×（1 − 病假工资比例）；比例按单位制度（60% / 70% / 80% 常见档），法规只托底「病假工资不低于当地最低工资标准的 80%」（劳部发〔1995〕309 号第 59 条）。</p>
            <p><strong>迟到扣款</strong> = 时薪 ÷ 60 × 累计迟到分钟（教学口径：按缺勤时间折算）；迟到扣款以依法制定的规章制度为准，且扣除后当月工资不得低于当地最低工资标准。</p>
            <p><strong>扣款法应发</strong> = 月薪 − 各项扣款（下限 0）；<strong>正算法应发</strong> = 日工资 × 实出勤天数 + 日工资 × 病假天数 × 病假比例 − 迟到扣款。</p>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">21.75 是什么口径？和月工作日 20.67 有什么区别？</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            21.75 是<b class="text-foreground">月计薪天数</b>（工资折算口径）：（365 − 104 个双休日）÷ 12，法定节假日带薪所以不减。
            2025 年 1 月 1 日起人社部发布同名新通知废止并替代原劳社部发〔2008〕3 号：法定节假日增至 13 天，<b class="text-foreground">月工作日</b>（排班 / 工时口径）
            调整为（365 − 104 − 13）÷ 12 ≈ 20.67 天，但月计薪天数仍为 21.75 天——算钱用 21.75，排班用 20.67。
            本页日工资、时薪折算一律按 21.75。另需注意：某个月的「应出勤天数」是当月具体排班问题（去除双休日、逢法定节假日再减），
            与 21.75 / 20.67 两个平均值口径并不相同，这也是正算法与扣款法出现差额的根源。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">旷工与「自动离职」的法律边界</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            旷工指无正当理由不出勤且未履行请假手续；单位可按依法制定并公示过的制度扣发旷工当日工资（不发劳动对价），
            严重违反规章制度的可依《劳动合同法》第 39 条解除合同且无需支付经济补偿——但「旷工 N 天视为自动离职、工资全部没收」
            这类约定没有法律效力：劳动关系不因旷工自动消灭，工资也必须结算至最后工作日。一句话：<b class="text-foreground">旷工可以不付当日工资，但「没收整月工资」违法</b>。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">正算法与扣款法为什么差钱？</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            扣款法以「整月工资为基数做减法」，正算法以「实际出勤为基数做加法」；当月应出勤天数恰好等于 21.75 时两者一致，
            否则会出现差额（极端例子：按扣款法出勤 21 天可能比出勤 22 天拿得更少）。实务中两种算法均有使用、存在争议，
            裁审机构多倾向选择对劳动者更有利的结果（部分地区地方规定与裁审指引有明确口径）。
            本页把两种口径并列展示并标出差额，谈判与核对工资条时可各算一遍、取更有利者主张。
          </p>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">月薪 8700，事假 2 天、迟到 90 分钟、病假 3 天（60%），应发多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">日工资 8700 ÷ 21.75 = 400 元。事假扣 400 × 2 = 800；迟到扣 50 ÷ 60 × 90 = 75；病假扣 400 × 3 × 40% = 480。扣款法应发 = 8700 − 800 − 75 − 480 = 7345 元（未计旷工）。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">迟到扣款有没有上限？</h3>
            <p class="text-sm text-muted-foreground mt-1">迟到扣款属于单位内部管理行为，应以依法制定、已公示的规章制度为依据，且「扣除后当月工资不得低于当地最低工资标准」；因劳动者本人原因造成经济损失的赔偿扣款，每月扣除一般不得超过当月工资的 20%。各地裁审口径有差异，以当地规定为准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">病假工资比例一定要按 60% 吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不是。全国层面法规只托底「不低于当地最低工资标准的 80%」（劳部发〔1995〕309 号第 59 条），具体比例按劳动合同或依法制定的单位制度执行（60% / 70% / 80% 是常见预设档）；部分地方有地区口径的以当地现行规定为准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">旷工一天扣三天工资合法吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">旷工当日未提供劳动，不发当日工资有依据；但「扣三天」属于惩罚性扣款，需有依法制定并公示的制度支撑，且扣除后不得低于最低工资、一般不超过当月工资 20% 的赔偿扣款上限口径——超额部分有被认定克扣工资的风险。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">应出勤天数怎么算？</h3>
            <p class="text-sm text-muted-foreground mt-1">按当月日历去除双休日即得参考值（本工具自动计算），逢法定节假日再减去；实行综合计算工时或不定时工作制的岗位另按审批口径执行。它决定「正算法 × 实出勤」的对照关系，工资折算基数仍是 21.75。</p>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">相关工具</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            摸鱼 / 每秒单价与实时工资用 <NuxtLink to="/tools/slacking-salary-counter/" class="text-primary hover:underline">摸鱼计算器</NuxtLink>；
            病假医疗期与病假工资下限校验用 <NuxtLink to="/tools/sick-leave-pay-calculator/" class="text-primary hover:underline">病假工资计算器</NuxtLink>；
            一周逐日工时与加班倍数统计可配合 <NuxtLink to="/tools/timesheet-calculator/" class="text-primary hover:underline">工时表计算器</NuxtLink>。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">口径来源与自查提示</h3>
          <ul class="text-xs text-muted-foreground leading-relaxed list-disc pl-5 space-y-1">
            <li>人社部《关于职工全年月平均工作时间和工资折算问题的通知》（2025-01-01 施行）：月计薪天数 21.75 天不变，月工作日 20.67 天（人社部官网、商务部政策文件库两源核对）。</li>
            <li>劳部发〔1995〕309 号第 59 条：病假工资可低于最低工资，但不得低于最低工资标准的 80%。</li>
            <li>《工资支付暂行规定》第 15 条：不得克扣工资（法定代扣除外）；第 16 条：经济损失赔偿每月扣除不超过 20% 且不得低于最低工资。</li>
            <li>《劳动法》第五十条：工资应当以货币形式按月支付，不得克扣或者无故拖欠。</li>
            <li>迟到 / 旷工扣款与病假比例均属单位自主管理范畴，页面为教学演示口径，<b class="text-foreground">以现行规定与本单位制度为准</b>。</li>
          </ul>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'attendance-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  CheckSquare, Calculator, Info, TriangleAlert, CheckCircle,
  ChevronDown, RefreshCw, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '考勤计算器 - 出勤天数/迟到/事假病假扣款在线核算应发工资',
  description: '免费在线考勤计算器：输入应出勤/实出勤天数、迟到分钟、事假病假旷工天数，按 21.75 计薪口径核算日工资与时薪，扣款法与正算法双口径对比应发工资，病假比例折算、最低工资下限红标校验，纯浏览器本地计算不上传',
  keywords: '考勤计算器,出勤天数计算,迟到扣款计算,事假扣款,病假扣款,旷工扣款,21.75计薪,应发工资计算',
  author: '有条工具',
  ogTitle: '考勤计算器 - 出勤天数/迟到/事假病假扣款在线核算应发工资 | 有条工具',
  ogDescription: '21.75 口径日工资折算，扣款法与正算法双口径对比，最低工资下限红标校验。',
  ogUrl: 'https://www.util.cn/tools/attendance-calculator',
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
          name: '考勤计算器',
          url: 'https://www.util.cn/tools/attendance-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['日工资 = 月薪 ÷ 21.75 现行计薪口径', '事假 / 病假 / 旷工 / 迟到四项扣款明细', '病假工资比例折算（单位制度口径）', '扣款法与正算法双口径对比', '当月应出勤工作日自动参考值', '当地最低工资下限红标校验', '纯本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '考勤计算器', item: 'https://www.util.cn/tools/attendance-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '月薪 8700，事假 2 天、迟到 90 分钟、病假 3 天（60%），应发多少？',
              acceptedAnswer: { '@type': 'Answer', text: '日工资 8700 ÷ 21.75 = 400 元。事假扣 800；迟到扣 50÷60×90 = 75；病假扣 400×3×40% = 480。扣款法应发 = 8700 − 800 − 75 − 480 = 7345 元。' }
            },
            {
              '@type': 'Question',
              name: '迟到扣款有没有上限？',
              acceptedAnswer: { '@type': 'Answer', text: '迟到扣款应以依法制定并公示的规章制度为依据，扣除后当月工资不得低于当地最低工资标准；经济损失赔偿口径每月扣除一般不超过当月工资 20%。以当地规定为准。' }
            },
            {
              '@type': 'Question',
              name: '病假工资比例一定要按 60% 吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不是。全国法规只托底不低于当地最低工资标准的 80%（劳部发〔1995〕309 号第 59 条），具体比例按劳动合同或单位制度执行，60%/70%/80% 为常见预设档。' }
            },
            {
              '@type': 'Question',
              name: '旷工一天扣三天工资合法吗？',
              acceptedAnswer: { '@type': 'Answer', text: '旷工当日不发工资有依据，但惩罚性加扣需有依法制定并公示的制度支撑，且不得低于最低工资、一般不超过当月工资 20% 的赔偿扣款上限口径，超额有被认定克扣的风险。' }
            },
            {
              '@type': 'Question',
              name: '正算法与扣款法为什么差钱？',
              acceptedAnswer: { '@type': 'Answer', text: '扣款法以整月工资做减法、正算法按实际出勤做加法，当月应出勤不等于 21.75 时出现差额；实务存在争议，裁审多倾向选择对劳动者更有利的口径。' }
            }
          ]
        }
      ]
    })
  }]
})

// ==PURE-START==
// ---------- 纯逻辑（可独立单测） ----------
// 口径依据（两源交叉核对）：
// - 月计薪天数 21.75 天：人社部《关于职工全年月平均工作时间和工资折算问题的通知》（2025-01-01 施行，
//   废止并替代劳社部发〔2008〕3 号，数值沿用不变；月工作日（365−104−13）÷12 ≈ 20.67 仅作排班口径）。
// - 日工资 = 月薪 ÷ 21.75；时薪 = 日工资 ÷ 8；每分钟 = 时薪 ÷ 60。
// - 病假下限：劳部发〔1995〕309 号第 59 条（不低于最低工资 80%）；比例按单位制度输入。
// - 迟到扣款：时薪 ÷ 60 × 累计分钟（教学口径），扣除后不得低于最低工资（页面提示，不在此函数内）。
// 金额一律 0.01 元定点（round2）。

function round2(x) {
  return Math.round((Number(x) || 0) * 100) / 100
}

function max0(x) {
  const n = Number(x)
  return isFinite(n) && n > 0 ? n : 0
}

// 百分比参数夹紧到 [0, 100]
function clampPct(x) {
  const n = Number(x)
  if (!isFinite(n)) return 0
  return Math.min(100, Math.max(0, n))
}

// 当月工作日参考值：仅剔除双休日（法定节假日不自动识别，需用户手动修正）
function workdaysOfMonth(y, m, DateCtor) {
  const Y = Math.round(Number(y))
  const M = Math.round(Number(m))
  if (!isFinite(Y) || !isFinite(M) || M < 1 || M > 12) return 0
  const last = new DateCtor(Y, M, 0).getDate()
  let days = 0
  for (let d = 1; d <= last; d++) {
    const wd = new DateCtor(Y, M - 1, d).getDay()
    if (wd !== 0 && wd !== 6) days += 1
  }
  return days
}

// 日工资 = 月薪 ÷ 21.75（月薪非法或 ≤0 时按 0）
function dailyWageOf(monthly) {
  const w = max0(monthly)
  return w > 0 ? round2(w / 21.75) : 0
}

// 时薪 = 日工资 ÷ 8
function hourlyWageOf(daily) {
  const d = max0(daily)
  return d > 0 ? round2(d / 8) : 0
}

// 每分钟单价 = 时薪 ÷ 60
function perMinuteOf(hourly) {
  const h = max0(hourly)
  return h > 0 ? round2(h / 60) : 0
}

// 四项扣款（0.01 定点）：事假 = 日工资×天；病假 = 日工资×天×(1−比例)；旷工 = 日工资×天；迟到 = 时薪÷60×分钟
function deductsOf(monthly, personalDays, sickDays, sickRatePct, absentDays, lateMinutes) {
  const daily = dailyWageOf(monthly)
  const hourly = hourlyWageOf(daily)
  const personal = round2(daily * max0(personalDays))
  const sick = round2(daily * max0(sickDays) * (1 - clampPct(sickRatePct) / 100))
  const absent = round2(daily * max0(absentDays))
  const late = round2(hourly / 60 * max0(lateMinutes))
  const total = round2(personal + sick + absent + late)
  return { personal, sick, absent, late, total }
}

// 扣款法应发 = max(0, 月薪 − 扣款合计)；超扣时标记 clamped
function payableByDeductOf(monthly, deducts) {
  const w = max0(monthly)
  const payable = round2(w - max0(deducts.total))
  return { payableDeduct: Math.max(0, payable), clamped: payable < 0 }
}

// 病假工资（正算法用）= 日工资 × 病假天数 × 比例
function sickPayOf(daily, sickDays, sickRatePct) {
  return round2(daily * max0(sickDays) * (clampPct(sickRatePct) / 100))
}

// 正算法应发 = 日工资 × 实出勤 + 病假工资 − 迟到扣款（下限 0）
function payableByPositiveOf(daily, actualDays, sickPay, lateDeduct) {
  const pay = daily * max0(actualDays) + max0(sickPay) - max0(lateDeduct)
  return round2(Math.max(0, pay))
}

// 最低工资下限校验：minWage ≤0 视为跳过
function minWageCheckOf(payable, minWage) {
  const mw = max0(minWage)
  if (mw <= 0) return { skip: true, breached: false, floor: 0 }
  return { skip: false, breached: payable < mw, floor: mw }
}

// 金额展示：千分位 + 固定 2 位小数
function fmtMoney(n) {
  const v = round2(n)
  const sign = v < 0 ? '-' : ''
  const parts = Math.abs(v).toFixed(2).split('.')
  return sign + parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + parts[1]
}

// 数字展示：去掉多余小数尾零
function fmtNum(n) {
  const v = Number(n)
  if (!isFinite(v)) return '0'
  return String(Math.round(v * 100) / 100)
}
// ==PURE-END==

// ---------- 页面状态 ----------
const YEAR_OPTIONS = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 4 + i)

const monthlyWage = ref(8700)
const year = ref('')
const month = ref('')
const expectedDays = ref('')
const actualDays = ref(17)
const lateCount = ref(3)
const lateMinutes = ref(90)
const personalLeaveDays = ref(2)
const sickLeaveDays = ref(3)
const absenteeismDays = ref(0)
const sickRatePct = ref(60)
const minWage = ref('')

// 选年月后自动填入当月工作日参考值（可手动修改）
watch([year, month], ([y, m]) => {
  if (y !== '' && m !== '') {
    expectedDays.value = workdaysOfMonth(Number(y), Number(m), Date)
  }
})

onMounted(() => {
  addRecentTool('attendance-calculator')
  const now = new Date()
  year.value = now.getFullYear()
  month.value = now.getMonth() + 1
})

// ---------- 归一化 ----------
const monthlyNum = computed(() => max0(monthlyWage.value))
const expectedNum = computed(() => max0(expectedDays.value))
const actualNum = computed(() => max0(actualDays.value))
const lateCountNum = computed(() => max0(lateCount.value))
const lateMinNum = computed(() => max0(lateMinutes.value))
const personalNum = computed(() => max0(personalLeaveDays.value))
const sickNum = computed(() => max0(sickLeaveDays.value))
const absentNum = computed(() => max0(absenteeismDays.value))
const sickRateNum = computed(() => clampPct(sickRatePct.value))

const inputErrors = computed(() => {
  const errs = []
  if (!(monthlyNum.value > 0)) errs.push('月工资需大于 0')
  if (expectedNum.value <= 0) errs.push('请填写或选择年月以生成应出勤天数')
  if (actualNum.value <= 0 && expectedNum.value > 0) errs.push('实出勤天数需大于 0（全月缺勤请填 1 再核对，或按当地口径另行处理）')
  return errs
})

const canCalc = computed(() => inputErrors.value.length === 0)

// 出勤一致性：实出勤 + 各类缺勤 vs 应出勤
const attendanceGap = computed(() => {
  if (expectedNum.value <= 0) return 0
  return round2(actualNum.value + personalNum.value + sickNum.value + absentNum.value - expectedNum.value)
})

// ---------- 核心测算 ----------
const result = computed(() => {
  const daily = dailyWageOf(monthlyNum.value)
  const hourly = hourlyWageOf(daily)
  const perMinute = perMinuteOf(hourly)
  const deducts = deductsOf(monthlyNum.value, personalNum.value, sickNum.value, sickRateNum.value, absentNum.value, lateMinNum.value)
  const byDeduct = payableByDeductOf(monthlyNum.value, deducts)
  const sickPay = sickPayOf(daily, sickNum.value, sickRateNum.value)
  const payablePositive = payableByPositiveOf(daily, actualNum.value, sickPay, deducts.late)
  return {
    daily,
    hourly,
    perMinute,
    deducts,
    payableDeduct: byDeduct.payableDeduct,
    clamped: byDeduct.clamped,
    sickPay,
    payablePositive
  }
})

const minWageCheck = computed(() => minWageCheckOf(result.value.payableDeduct, minWage.value))

// 复制结果（navigator.clipboard + alert）
function copyResult() {
  const r = result.value
  const lines = [
    '【考勤工资测算】',
    `日工资：${fmtMoney(r.daily)} 元（月薪 ${fmtMoney(monthlyNum.value)} ÷ 21.75）；时薪 ${fmtMoney(r.hourly)} 元`,
    `扣款法应发：${fmtMoney(r.payableDeduct)} 元 = 月薪 − 事假 ${fmtMoney(r.deducts.personal)} − 病假 ${fmtMoney(r.deducts.sick)} − 旷工 ${fmtMoney(r.deducts.absent)} − 迟到 ${fmtMoney(r.deducts.late)}`,
    `正算法应发：${fmtMoney(r.payablePositive)} 元（日工资 × 实出勤 ${fmtNum(actualNum.value)} + 病假工资 ${fmtMoney(r.sickPay)} − 迟到 ${fmtMoney(r.deducts.late)}）`,
    minWageCheck.value.skip ? '最低工资校验：未填写，已跳过' : `最低工资校验：${minWageCheck.value.breached ? '低于当地月最低工资 ' + fmtMoney(minWageCheck.value.floor) + '，请注意' : '通过'}`,
    '免责：教学演示口径，以现行法规原文、当地规定与单位制度为准。'
  ].join('\n')
  navigator.clipboard.writeText(lines).then(() => alert('已复制')).catch(() => alert('复制失败，请手动复制'))
}

function loadExample() {
  monthlyWage.value = 8700
  actualDays.value = 17
  lateCount.value = 3
  lateMinutes.value = 90
  personalLeaveDays.value = 2
  sickLeaveDays.value = 3
  absenteeismDays.value = 0
  sickRatePct.value = 60
  minWage.value = ''
  if (year.value === '' || month.value === '') {
    const now = new Date()
    year.value = now.getFullYear()
    month.value = now.getMonth() + 1
  }
}

function resetAll() {
  monthlyWage.value = ''
  actualDays.value = ''
  lateCount.value = ''
  lateMinutes.value = ''
  personalLeaveDays.value = ''
  sickLeaveDays.value = ''
  absenteeismDays.value = ''
  sickRatePct.value = 60
  minWage.value = ''
}
</script>
