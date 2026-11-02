<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Scale class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">劳动补偿金计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">按《劳动合同法》通用口径估算 N / N+1 / 2N 三种补偿口径，年限折算与社平 3 倍封顶自动判定</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线劳动补偿金计算器：输入入职与离职日期、离职前 12 个月平均月工资（税前应发）与当地社平月工资，
        按《劳动合同法》第 46 / 47 / 87 条通用口径同时算出 N、N+1、2N 三种金额，自动完成「6 个月规则」年限折算、
        社平 3 倍封顶与 12 年年限封顶判定，并给出逐步明细、所选解除情形的法律依据与三口径对照（供协商谈判参考）。
        全部计算在浏览器本地完成，不上传、不保存任何工资数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calendar class="w-5 h-5 mr-2 text-primary" /> 离职信息与情形
        </h2>

        <!-- 任职区间 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">任职区间</label>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-xs text-muted-foreground mb-1 block">入职日期</label>
              <input
                v-model="startDate"
                type="date"
                class="w-full px-2.5 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="text-xs text-muted-foreground mb-1 block">离职日期</label>
              <input
                v-model="endDate"
                type="date"
                class="w-full px-2.5 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <p v-if="dateError" class="mt-2 text-xs leading-relaxed text-red-500 p-2 rounded bg-red-500/10 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ dateError }}</span>
          </p>
        </div>

        <!-- 月均工资 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">离职前 12 个月平均月工资（税前应发）</label>
          <div class="flex items-center gap-2">
            <input
              v-model.number="salary"
              type="number"
              min="0"
              step="1"
              placeholder="如 18000"
              class="flex-1 min-w-0 px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span class="text-xs text-muted-foreground flex-shrink-0">元 / 月</span>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed mt-1.5 flex items-start gap-1">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>含基本工资、奖金、津贴与补贴等货币性收入的税前应发口径，取解除或终止前 12 个月的平均值。</span>
          </p>
        </div>

        <!-- 当地社平月工资 + 城市速选 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">当地社平月工资</label>
          <div class="flex items-center gap-2">
            <select
              v-model="citySelected"
              @change="onCityChange"
              class="flex-shrink-0 px-2.5 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="城市速选"
            >
              <option v-for="c in CITY_PRESETS" :key="c.name" :value="c.name">{{ c.name }}</option>
            </select>
            <input
              v-model.number="socialAvg"
              type="number"
              min="0"
              step="100"
              class="flex-1 min-w-0 px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span class="text-xs text-muted-foreground flex-shrink-0">元</span>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed mt-1.5 flex items-start gap-1">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>上年度全口径城镇单位就业人员月平均工资，以当地人社局公布为准。</span>
          </p>
          <p class="text-[10px] text-muted-foreground/80 leading-relaxed mt-1">
            城市速选为常见量级参考（约 2023—2024 年度口径），非实时数据。
          </p>
        </div>

        <!-- 解除情形 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">解除情形</label>
          <select
            v-model="scenarioId"
            class="w-full px-2.5 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="s in SCENARIOS" :key="s.id" :value="s.id">{{ s.label }} → {{ s.short }}</option>
          </select>
          <p class="text-xs leading-relaxed mt-2 p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>{{ activeScenario.desc }}</span>
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
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 补偿测算结果
          </h2>
          <span v-if="canCalc" class="text-xs text-muted-foreground hidden sm:block">当前口径：{{ activeScenario.short }}</span>
        </div>

        <template v-if="canCalc">
          <!-- 工龄卡：年限 → 折算单位 → 基数，封顶时红字说明 -->
          <div class="bg-primary/10 rounded-lg p-4 space-y-2">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="text-xs text-muted-foreground mb-1">工作年限</p>
                <p class="text-2xl font-bold text-foreground">{{ serviceText }}</p>
              </div>
              <div class="text-primary text-xl font-semibold" aria-hidden="true">→</div>
              <div class="text-right">
                <p class="text-xs text-muted-foreground mb-1">折算补偿单位（第 47 条）</p>
                <p class="text-2xl font-bold text-primary">{{ fmtUnits(result.units) }} 个月工资基数</p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground">
              补偿基数 {{ fmtMoney(result.base) }} 元 / 月（税前应发口径）· 当前情形 {{ activeScenario.short }}
            </p>
            <p v-if="result.capped" class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>月工资超社平 3 倍，按 3 倍封顶且年限封顶 12 年（《劳动合同法》第 47 条第 2 款）。</span>
            </p>
            <p v-else class="text-xs leading-relaxed p-2.5 rounded bg-green-500/10 text-green-600 flex items-start gap-1.5">
              <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>月工资未超社平 3 倍，按实际平均工资计，不适用 12 年年限上限。</span>
            </p>
          </div>

          <!-- 主动辞职：法定应付 0 的说明卡 -->
          <p v-if="result.zero.isZero" class="text-xs leading-relaxed p-3 rounded bg-yellow-500/10 text-foreground flex items-start gap-1.5">
            <Info class="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <span>{{ result.zero.note }}</span>
          </p>

          <!-- 三口径结果卡：高亮当前情形，其余淡化但仍显示供对照谈判 -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              v-for="card in resultCards"
              :key="card.key"
              class="relative rounded-lg border p-4 text-center"
              :class="card.active ? 'border-primary bg-primary/10' : 'border-border bg-muted/40 opacity-70'"
            >
              <span
                v-if="card.active"
                class="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground"
              >当前情形</span>
              <p class="text-xs text-muted-foreground mb-1">{{ card.title }}</p>
              <p class="text-xl font-bold" :class="card.active ? 'text-primary' : 'text-muted-foreground'">
                ¥{{ fmtMoney(card.value) }}
              </p>
              <p class="text-[10px] text-muted-foreground mt-1">{{ card.sub }}</p>
            </div>
          </div>

          <!-- 明细过程表：每行 = 一步公式代入（年限折算 → 基数判定 → 封顶判定 → 乘法） -->
          <div class="border border-border rounded-lg overflow-hidden">
            <div class="px-4 py-2.5 bg-muted/40 border-b border-border">
              <p class="text-sm font-semibold text-foreground">计算明细（公式代入过程）</p>
            </div>
            <table class="w-full text-sm">
              <thead>
                <tr class="text-xs text-muted-foreground border-b border-border">
                  <th class="px-4 py-2 text-left font-medium w-28">步骤</th>
                  <th class="px-4 py-2 text-left font-medium">公式代入</th>
                  <th class="px-4 py-2 text-right font-medium">结果</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(st, i) in detailSteps" :key="i" class="border-b border-border/40 last:border-0">
                  <td class="px-4 py-2 text-foreground font-medium align-top">{{ st.label }}</td>
                  <td class="px-4 py-2 text-muted-foreground align-top">{{ st.formula }}</td>
                  <td class="px-4 py-2 text-right font-mono text-foreground align-top whitespace-nowrap">{{ st.value }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 情形说明卡：所选情形的法律依据 -->
          <div class="border border-border rounded-lg p-4 bg-muted/30 flex items-start gap-2">
            <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div class="min-w-0">
              <p class="text-sm font-semibold text-foreground">{{ activeScenario.label }}（{{ activeScenario.short }}）</p>
              <p class="text-sm text-muted-foreground mt-1 leading-relaxed">{{ activeScenario.desc }}</p>
              <p class="text-xs text-muted-foreground mt-1.5">法律依据：{{ activeScenario.law }}</p>
            </div>
          </div>

          <!-- 常见问答提示条（静态） -->
          <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>常见问答：协商离职时公司通常只给 N 或 N+1，2N 需仲裁认定违法解除才能拿到；「未提前 30 日通知」的 +1 仅适用于无过失性辞退情形。</span>
          </p>
        </template>

        <!-- 输入不完整时的空状态 -->
        <div v-else class="text-center text-muted-foreground py-16">
          <TriangleAlert class="w-10 h-10 mx-auto mb-3 text-yellow-500" />
          <p class="text-sm">请先完善左侧输入：{{ inputErrors.join('；') }}。</p>
          <p class="text-xs text-muted-foreground/70 mt-1">也可以点击「载入示例」先看一条完整测算：2020-03-01 入职、2026-11-30 离职、月薪 18000 元、社平 8000 元、无过失性辞退。</p>
        </div>
      </div>
    </div>

    <!-- 免责声明（页面固定） -->
    <p class="text-xs text-muted-foreground leading-relaxed mb-8 flex items-start gap-1.5">
      <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
      <span>本工具按《劳动合同法》第 46/47/87 条通用口径估算，不构成法律意见；各地仲裁口径与司法实践存在差异，争议请咨询当地劳动仲裁机构或执业律师。</span>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>劳动补偿金（经济补偿）怎么算？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          劳动补偿金计算器是一款面向离职谈判的在线估算工具。它以《劳动合同法》第 46 条（哪些解除情形应付经济补偿）、
          第 47 条（经济补偿怎么算）与第 87 条（违法解除的二倍赔偿）为通用口径，输入任职区间、离职前 12 个月平均月工资与当地社平月工资后，
          并行给出 N、N+1、2N 三种金额：自动按「6 个月规则」把工作年限折算成补偿月数，按社平 3 倍与 12 年上限做双重封顶判定，
          并逐步展示每一步公式代入过程。三口径并列展示是为了对照谈判——实际能拿到哪一档，取决于解除性质与证据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">N、N+1、2N 分别是什么？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          <b class="text-foreground">N（经济补偿金）</b>：按劳动者在本单位的工作年限，每满一年支付一个月工资（第 47 条第 1 款），
          适用于单位提出的协商一致解除、合同期满单位不续签、经济性裁员等第 46 条列举情形。
          <b class="text-foreground">N+1</b>：在 N 之外额外支付 1 个月工资（代通知金）。「+1」只出现在第 40 条的无过失性辞退中，
          且以单位未提前 30 日书面通知为前提；代通知金法定按解除前上月工资标准确定（《劳动合同法实施条例》第 20 条），
          本工具简化为与 N 同一基数代入。协商解除、裁员、期满终止都没有法定的「+1」。
          <b class="text-foreground">2N（赔偿金）</b>：用人单位违反本法规定解除或终止劳动合同的，按经济补偿标准的二倍向劳动者支付赔偿金（第 87 条），
          通常需要经劳动仲裁或法院认定「违法解除」才能主张，公司一般不会主动按 2N 结算。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">工作年限怎么折算？（6 个月规则）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          每满一年计 1 个月工资；剩余零头<b class="text-foreground">满 6 个月按 1 年计</b>（再加 1 个月）、
          <b class="text-foreground">不满 6 个月支付半个月工资</b>（再加 0.5 个月）。例如：3 年 7 个月折算 4 个月、
          3 年 5 个月折算 3.5 个月、3 年 2 个月折算 3.5 个月、刚满 6 个月折算 1 个月、刚工作 5 个月折算 0.5 个月。
          本工具按「周年日 + 整月」口径折算，不足整月的天数并入零头按「不满 6 个月」处理；日期计算统一使用 UTC 口径，
          避免不同时区浏览器出现「差一天」的漂移。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">月工资怎么算？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          按劳动合同解除或终止前 12 个月的<b class="text-foreground">平均税前应发工资</b>计算，包含计时 / 计件工资、奖金、
          津贴和补贴等货币性收入（第 47 条第 3 款、《劳动合同法实施条例》第 27 条）；工作不满 12 个月的，按实际工作的月数平均。
          需要注意：加班费是否计入、年终奖如何摊薄，各地仲裁实践中口径存在差异；本工具按你填写的平均值直接代入，不自动拆分工资结构。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">社平 3 倍封顶是什么？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          劳动者月工资高于用人单位所在直辖市、设区的市级人民政府公布的本地区上年度职工月平均工资三倍的：
          向其支付经济补偿的标准按<b class="text-foreground">职工月平均工资三倍</b>的数额支付，
          且向其支付经济补偿的<b class="text-foreground">年限最高不超过十二年</b>（第 47 条第 2 款）。
          两条封顶只对「月工资超社平 3 倍」的高收入劳动者同时适用；未超过 3 倍的按实际平均工资计算、年限不封顶。
          各地社平工资逐年公布，速选值仅为量级参考，请以当地人社局最新公布数为准。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">协商离职和被辞退有什么区别？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          核心看「谁提出、以什么理由」：单位主动提出并与你协商一致解除 → 应付 N（第 46 条第 2 项）；
          你自己主动提出协商或因个人原因辞职 → 一般没有经济补偿；公司无过失性辞退（医疗期满不能工作、不胜任工作经调岗培训仍不胜任、
          客观情况发生重大变化）→ N，未提前 30 日书面通知时再加 1 个月代通知金；员工严重违纪等过失性辞退（第 39 条）→ 0；
          无法定理由或程序违法解除 → 经仲裁认定后可主张 2N（第 87 条）。实践中协商离职的「打包价」常在 N 到 N+1 之间谈判，
          可用本页三口径结果作为对照参考。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">本工具会保存我的工资数据吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          不会。本页不做任何持久化：所有输入只存在于当前页面的内存中参与计算，不写入 localStorage、不发送任何网络请求，
          刷新或关闭页面后自动清空。城市速选值也只是常见量级参考（约 2023—2024 年度口径），实际请以当地人社局公布的
          上年度全口径城镇单位就业人员月平均工资为准。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">N、N+1、2N 分别是什么？</h3>
            <p class="text-sm text-muted-foreground mt-1">N 是按工作年限每满一年支付一个月工资的经济补偿（《劳动合同法》第 47 条）；N+1 是在 N 之外加 1 个月代通知金，仅适用于无过失性辞退且未提前 30 日书面通知的情形；2N 是违法解除劳动合同时按经济补偿标准二倍支付的赔偿金（第 87 条）。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">工作年限怎么折算？</h3>
            <p class="text-sm text-muted-foreground mt-1">每满一年计 1 个月工资；剩余零头满 6 个月按 1 年计（加 1 个月），不满 6 个月按半个月工资计（加 0.5 个月）。例：3 年 7 个月折算为 4 个月，3 年 5 个月折算为 3.5 个月，刚满 6 个月折算为 1 个月。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">月工资按什么口径计算？</h3>
            <p class="text-sm text-muted-foreground mt-1">按解除或终止劳动合同前 12 个月的平均税前应发工资计算，含基本工资、奖金、津贴与补贴等货币性收入；工作不满 12 个月的按实际月数平均。各地对加班费与年终奖摊薄的口径存在差异，以当地仲裁实践为准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">社平 3 倍封顶是什么？</h3>
            <p class="text-sm text-muted-foreground mt-1">月工资高于当地上年度社平月工资 3 倍的劳动者，经济补偿基数按社平 3 倍封顶，且补偿年限最高不超过 12 年（《劳动合同法》第 47 条第 2 款）；未超过 3 倍的按实际平均工资计算、年限不封顶。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">协商离职和被辞退有什么区别？</h3>
            <p class="text-sm text-muted-foreground mt-1">单位提出的协商一致解除应付 N；个人原因主动辞职一般无补偿；无过失性辞退应付 N 或未提前 30 日通知时的 N+1；严重违纪的过失性辞退为 0；违法解除经仲裁认定后可主张 2N。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">本工具会保存我的工资数据吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有输入只在当前页面内存中参与计算，不写入浏览器本地存储、不上传服务器，刷新或关闭页面后自动清空。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'labor-severance-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Scale, Calendar, Calculator, Info, TriangleAlert, CheckCircle,
  ChevronUp, ChevronDown, RefreshCw
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '劳动补偿金计算器 - N/N+1/2N 经济补偿金在线计算',
  description: '免费在线劳动补偿金计算器：按《劳动合同法》第 46/47/87 条口径同时测算 N、N+1、2N 三种补偿金额，自动完成 6 个月规则年限折算、社平工资 3 倍封顶与 12 年年限封顶判定，附六种解除情形法律依据与逐步明细，纯浏览器本地计算不上传',
  keywords: '劳动补偿金计算器,经济补偿金计算,N+1是什么意思,2N赔偿金,代通知金,经济补偿年限折算,社平工资三倍封顶,劳动合同法47条,离职补偿计算',
  author: '有条工具',
  ogTitle: '劳动补偿金计算器 - N/N+1/2N 经济补偿金在线计算 | 有条工具',
  ogDescription: 'N / N+1 / 2N 三口径并行测算，年限折算与社平 3 倍封顶自动判定，逐步明细一目了然。',
  ogUrl: 'https://www.util.cn/tools/labor-severance-calculator',
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
          name: '劳动补偿金计算器',
          url: 'https://www.util.cn/tools/labor-severance-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['N / N+1 / 2N 三口径并行测算', '6 个月规则年限折算（UTC 口径）', '社平 3 倍封顶与 12 年年限封顶判定', '六种解除情形法律依据说明', '逐步明细公式代入表', '纯本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '劳动补偿金计算器', item: 'https://www.util.cn/tools/labor-severance-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'N、N+1、2N 分别是什么？',
              acceptedAnswer: { '@type': 'Answer', text: 'N 是按工作年限每满一年支付一个月工资的经济补偿（《劳动合同法》第47条）；N+1 是在 N 之外加 1 个月代通知金，仅适用于无过失性辞退且未提前 30 日书面通知的情形；2N 是违法解除劳动合同时按经济补偿标准二倍支付的赔偿金（第87条）。' }
            },
            {
              '@type': 'Question',
              name: '工作年限怎么折算？',
              acceptedAnswer: { '@type': 'Answer', text: '每满一年计 1 个月工资；剩余零头满 6 个月按 1 年计（加 1 个月），不满 6 个月按半个月工资计（加 0.5 个月）。例：3 年 7 个月折算为 4 个月，3 年 5 个月折算为 3.5 个月，刚满 6 个月折算为 1 个月。' }
            },
            {
              '@type': 'Question',
              name: '月工资按什么口径计算？',
              acceptedAnswer: { '@type': 'Answer', text: '按解除或终止劳动合同前 12 个月的平均税前应发工资计算，含基本工资、奖金、津贴与补贴等货币性收入；工作不满 12 个月的按实际月数平均。各地对加班费与年终奖摊薄的口径存在差异，以当地仲裁实践为准。' }
            },
            {
              '@type': 'Question',
              name: '社平 3 倍封顶是什么？',
              acceptedAnswer: { '@type': 'Answer', text: '月工资高于当地上年度社平月工资 3 倍的劳动者，经济补偿基数按社平 3 倍封顶，且补偿年限最高不超过 12 年（《劳动合同法》第47条第2款）；未超过 3 倍的按实际平均工资计算、年限不封顶。' }
            },
            {
              '@type': 'Question',
              name: '协商离职和被辞退有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '单位提出的协商一致解除应付 N；个人原因主动辞职一般无补偿；无过失性辞退应付 N 或未提前 30 日通知时的 N+1；严重违纪的过失性辞退为 0；违法解除经仲裁认定后可主张 2N。' }
            },
            {
              '@type': 'Question',
              name: '本工具会保存我的工资数据吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有输入只在当前页面内存中参与计算，不写入浏览器本地存储、不上传服务器，刷新或关闭页面后自动清空。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 日期一律按 UTC 口径处理（参照站内 gantt-chart-maker 的做法），避免本地时区导致的「差一天」漂移

// 保留 2 位小数（规避浮点误差：Math.round(x*100)/100）
function round2(x) {
  return Math.round(x * 100) / 100
}

// 严格解析 YYYY-MM-DD，返回 UTC 零点 Date；格式或日期不存在（如 2026-02-30）时返回 null
function parseYmd(s) {
  if (typeof s !== 'string') return null
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s.trim())
  if (!m) return null
  const y = +m[1]
  const mo = +m[2]
  const d = +m[3]
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  const dt = new Date(Date.UTC(y, mo - 1, d))
  // 回读校验：拦截「格式合法但不存在」的日期
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null
  return dt
}

// 金额入参收敛：非有限数值或 ≤0 按 0 处理
function moneyOf(v) {
  const n = Number(v)
  return isFinite(n) && n > 0 ? n : 0
}

// 加 n 个自然月（UTC 口径）；目标月没有对应日时收敛到该月最后一天（如 01-31 加 1 月 → 02-29）
function addMonthsUtc(d, n) {
  const y = d.getUTCFullYear()
  const mo = d.getUTCMonth() + n
  const day = d.getUTCDate()
  const lastDay = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate()
  return new Date(Date.UTC(y, mo, Math.min(day, lastDay)))
}

// 工龄折算（《劳动合同法》第 47 条第 1 款口径）：
// 每满一年计 1 个月工资；剩余零头满 6 个月按 1 年计（+1）、不满 6 个月按半个月计（+0.5）。
// 返回 { years, months, units }：units 为 0.5 的整数倍（如 3 年 7 个月 → 4，3 年 5 个月 → 3.5）；
// 不足整月的天数并入零头、仍按「不满 6 个月」处理；起止同日为 0；起止倒挂或日期非法返回全 0（由页面校验兜底提示）。
function serviceUnitsOf(start, end) {
  const s = parseYmd(start)
  const e = parseYmd(end)
  if (!s || !e || e.getTime() < s.getTime()) return { years: 0, months: 0, units: 0 }
  let totalMonths = (e.getUTCFullYear() - s.getUTCFullYear()) * 12 + (e.getUTCMonth() - s.getUTCMonth())
  if (e.getUTCDate() < s.getUTCDate()) totalMonths -= 1 // 未到周年日，最后一月不算满
  if (totalMonths < 0) totalMonths = 0
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  const anniv = addMonthsUtc(s, totalMonths)
  const hasLeftoverDays = anniv.getTime() < e.getTime() // 整月之外还有零头天数
  let units = years
  if (months >= 6) units += 1
  else if (months > 0 || hasLeftoverDays) units += 0.5
  return { years, months, units }
}

// 基数判定（《劳动合同法》第 47 条第 2 款）：
// 月工资 ≤ 社平 3 倍 → 按实际工资；超过 → 按社平月工资 3 倍封顶，capped=true
function cappedBaseOf(salary, socialAvg) {
  const s = moneyOf(salary)
  const avg = moneyOf(socialAvg)
  if (avg <= 0) return { base: s, capped: false } // 社平缺失时无法封顶，退回实际工资（页面校验会拦截该输入）
  const cap = round2(avg * 3)
  return s <= cap ? { base: s, capped: false } : { base: cap, capped: true }
}

// 年限封顶（《劳动合同法》第 47 条第 2 款）：仅「月工资超社平 3 倍」的高收入者适用 12 年上限，其余年限不封顶
function cappedUnitsOf(units, capped) {
  return capped ? Math.min(units, 12) : units
}

// 经济补偿金额 = 折算单位 × 月工资基数，保留 2 位小数
function severanceOf(units, base) {
  return round2(units * base)
}

// 六种解除情形：type 决定高亮哪张结果卡（ZERO 表示法定应付 0）
const SCENARIOS = [
  {
    id: 'negotiated',
    type: 'N',
    short: 'N',
    label: '协商一致解除（公司提出）',
    desc: '单位主动提出并与你协商一致解除劳动合同的，应付经济补偿（N）；若是你主动提出协商离职，则没有补偿。',
    law: '《劳动合同法》第 36 条、第 46 条第 2 项'
  },
  {
    id: 'noFault',
    type: 'N1',
    short: 'N+1',
    label: '无过失性辞退（未提前 30 日书面通知）',
    desc: '医疗期满不能从事工作、不胜任工作经调岗培训仍不胜任、客观情况发生重大变化三种情形下解除，且未提前 30 日书面通知的，在 N 之外额外支付 1 个月工资（代通知金）。',
    law: '《劳动合同法》第 40 条、《劳动合同法实施条例》第 20 条'
  },
  {
    id: 'illegal',
    type: '2N',
    short: '2N',
    label: '违法解除',
    desc: '单位无法定理由或程序违法解除劳动合同的，应按经济补偿标准的二倍支付赔偿金（2N），通常需经仲裁或法院认定「违法解除」。',
    law: '《劳动合同法》第 87 条'
  },
  {
    id: 'expired',
    type: 'N',
    short: 'N',
    label: '劳动合同期满终止（单位不续）',
    desc: '合同到期单位不续签（或降低条件续签你不同意）导致期满终止的，应付经济补偿（N）；单位维持或提高条件而你不同意续签的除外。',
    law: '《劳动合同法》第 44 条、第 46 条第 5 项'
  },
  {
    id: 'layoff',
    type: 'N',
    short: 'N',
    label: '经济性裁员',
    desc: '单位依破产重整、生产经营发生严重困难等法定情形裁减人员（20 人以上或不足 20 人但占职工总数 10% 以上）的，应付经济补偿（N）。',
    law: '《劳动合同法》第 41 条、第 46 条第 4 项'
  },
  {
    id: 'resign',
    type: 'ZERO',
    short: '0',
    label: '员工主动辞职（无补偿）',
    desc: '因个人原因主动辞职的，不属于应付经济补偿的情形；但若因单位拖欠工资、未缴社保等原因被迫解除合同（第 38 条），仍可主张 N。',
    law: '《劳动合同法》第 46 条（主动辞职不在列举范围内）'
  }
]

function scenarioOf(id) {
  return SCENARIOS.find((s) => s.id === id) || SCENARIOS[0]
}

// 主动辞职情形的说明文案（显示于结果区说明卡）
const ZERO_NOTE =
  '员工因个人原因主动辞职，不属于《劳动合同法》第 46 条列举的应付经济补偿情形，法定经济补偿为 0；' +
  '工龄卡中的折算结果仅供与单位协商时对照。若实际是因单位拖欠工资、未缴社保等原因被迫解除（第 38 条），仍可主张 N。'

// 城市速选：常见量级参考值（约 2023—2024 年度全口径口径），非实时，以当地人社局公布为准
const CITY_PRESETS = [
  { name: '北京', avg: 12500 },
  { name: '上海', avg: 12300 },
  { name: '深圳', avg: 11600 },
  { name: '广州', avg: 11000 },
  { name: '杭州', avg: 10000 },
  { name: '成都', avg: 8500 },
  { name: '武汉', avg: 8800 },
  { name: '西安', avg: 8000 },
  { name: '自定义', avg: null }
]

// 金额展示：千分位 + 固定 2 位小数（手工实现，避免 SSR 与浏览器 locale 差异导致 hydration 不一致）
function fmtMoney(n) {
  const v = round2(Number(n) || 0)
  const sign = v < 0 ? '-' : ''
  const parts = Math.abs(v).toFixed(2).split('.')
  return sign + parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + parts[1]
}

// 单位展示：整数不带小数，0.5 档显示 1 位小数
function fmtUnits(u) {
  const n = Number(u) || 0
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10)
}

// 「X 年 Y 个月」展示文本
function serviceTextOf(s) {
  const parts = []
  if (s && s.years > 0) parts.push(`${s.years} 年`)
  if (s && s.months > 0) parts.push(`${s.months} 个月`)
  return parts.length ? parts.join(' ') : '0 个月'
}

// 全链路汇总：工龄折算 → 基数判定 → 年限封顶 → 三口径金额
// N = severance；N+1 = N + 代通知金 1 个月工资（代通知金法定按上月工资口径，此处简化用同一基数，页面已注明）；
// 2N = N × 2（违法解除赔偿金，第 47 / 87 条口径）；resign 情形三口径均为 0 并附说明。
// 返回 { service, base, capped, units, rawUnits, n, nPlus1, twoN, zero: { isZero, note }, scenario }
function calcAll(input) {
  const src = input && typeof input === 'object' ? input : {}
  const service = serviceUnitsOf(src.start, src.end)
  const baseOf = cappedBaseOf(src.salary, src.socialAvg)
  const rawUnits = service.units
  const units = cappedUnitsOf(rawUnits, baseOf.capped)
  const sc = scenarioOf(src.scenario)
  const isZero = sc.type === 'ZERO'
  const n = isZero || units <= 0 ? 0 : severanceOf(units, baseOf.base)
  const nPlus1 = isZero ? 0 : round2(n + baseOf.base)
  const twoN = isZero ? 0 : round2(n * 2)
  return {
    service,
    base: baseOf.base,
    capped: baseOf.capped,
    units,
    rawUnits,
    n,
    nPlus1,
    twoN,
    zero: { isZero, note: isZero ? ZERO_NOTE : '' },
    scenario: sc
  }
}

// 明细过程表：每行 = 一步公式代入（年限折算 → 基数判定 → 封顶判定 → 乘法），可读性优先
function detailStepsOf(input) {
  const src = input && typeof input === 'object' ? input : {}
  const r = calcAll(src)
  const s = r.service
  const salary = moneyOf(src.salary)
  const socialAvg = moneyOf(src.socialAvg)
  const steps = []

  const bump = s.units > s.years
    ? (s.units - s.years === 1 ? '，剩余满 6 个月按 1 年计' : '，剩余不满 6 个月按 0.5 个月计')
    : ''
  steps.push({
    label: '工龄折算',
    formula: `入职 ${src.start || '—'} ～ 离职 ${src.end || '—'}，共 ${serviceTextOf(s)}${bump}`,
    value: `折算 ${fmtUnits(s.units)} 个月`
  })
  steps.push({
    label: '基数判定',
    formula: `月均工资 ${fmtMoney(salary)} 元，社平 3 倍 = ${fmtMoney(socialAvg)} × 3 = ${fmtMoney(round2(socialAvg * 3))} 元`,
    value: r.capped ? `超 3 倍，按 ${fmtMoney(r.base)} 元封顶` : `按实际工资 ${fmtMoney(r.base)} 元计`
  })
  steps.push({
    label: '年限封顶判定',
    formula: r.capped ? '月工资超社平 3 倍，适用第 47 条第 2 款 12 年年限上限' : '未触发社平 3 倍封顶，不适用 12 年年限上限',
    value: r.capped && s.units > 12 ? `${fmtUnits(s.units)} → 封顶 12 个月` : `计入 ${fmtUnits(r.units)} 个月`
  })

  if (r.zero.isZero) {
    steps.push({
      label: '本情形应付',
      formula: `${r.scenario.label}：不属于第 46 条应付经济补偿情形`,
      value: '0 元'
    })
    return steps
  }

  steps.push({
    label: 'N（经济补偿）',
    formula: `N = ${fmtUnits(r.units)} × ${fmtMoney(r.base)}`,
    value: `${fmtMoney(r.n)} 元`
  })
  steps.push({
    label: 'N+1（含代通知金）',
    formula: `N + 1 个月 = ${fmtMoney(r.n)} + ${fmtMoney(r.base)}（代通知金简化按同一基数，法定按上月工资）`,
    value: `${fmtMoney(r.nPlus1)} 元`
  })
  steps.push({
    label: '2N（违法解除赔偿金）',
    formula: `2 × N = 2 × ${fmtMoney(r.n)}（第 87 条口径）`,
    value: `${fmtMoney(r.twoN)} 元`
  })
  return steps
}

// ---------- 页面状态 ----------
const startDate = ref('2020-03-01')
const endDate = ref('2026-11-30')
const salary = ref(18000)
const socialAvg = ref(8000)
const citySelected = ref('自定义')
const scenarioId = ref('noFault')
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 输入校验 ----------
const dateError = computed(() => {
  if (parseYmd(startDate.value) && parseYmd(endDate.value) && endDate.value < startDate.value) {
    return '离职日期不能早于入职日期'
  }
  return ''
})

const inputErrors = computed(() => {
  const errs = []
  if (!parseYmd(startDate.value)) errs.push('请选择入职日期')
  if (!parseYmd(endDate.value)) errs.push('请选择离职日期')
  if (dateError.value) errs.push(dateError.value)
  if (!(Number(salary.value) > 0)) errs.push('月均工资需大于 0')
  if (!(Number(socialAvg.value) > 0)) errs.push('社平工资需大于 0')
  return errs
})

const canCalc = computed(() => inputErrors.value.length === 0)

// ---------- 计算与展示派生 ----------
const calcInput = computed(() => ({
  start: startDate.value,
  end: endDate.value,
  salary: salary.value,
  socialAvg: socialAvg.value,
  scenario: scenarioId.value
}))

const result = computed(() => calcAll(calcInput.value))
const detailSteps = computed(() => detailStepsOf(calcInput.value))
const activeScenario = computed(() => scenarioOf(scenarioId.value))
const serviceText = computed(() => serviceTextOf(result.value.service))

// 三口径结果卡：当前情形对应的卡片高亮，其余淡化但仍显示供对照谈判
const resultCards = computed(() => [
  { key: 'N', title: 'N（经济补偿）', value: result.value.n, active: activeScenario.value.type === 'N', sub: '每满一年支付一个月工资' },
  { key: 'N1', title: 'N+1（含代通知金）', value: result.value.nPlus1, active: activeScenario.value.type === 'N1', sub: '额外 1 个月代通知金' },
  { key: '2N', title: '2N（违法解除赔偿金）', value: result.value.twoN, active: activeScenario.value.type === '2N', sub: '经济补偿标准的二倍' }
])

// ---------- 城市速选 ----------
function onCityChange() {
  const preset = CITY_PRESETS.find((c) => c.name === citySelected.value)
  if (preset && preset.avg !== null) socialAvg.value = preset.avg // 自定义保留当前值
}

// ---------- 示例与重置 ----------
function loadExample() {
  startDate.value = '2020-03-01'
  endDate.value = '2026-11-30'
  salary.value = 18000
  socialAvg.value = 8000
  citySelected.value = '自定义'
  scenarioId.value = 'noFault'
}

function resetAll() {
  startDate.value = ''
  endDate.value = ''
  salary.value = ''
  socialAvg.value = 8000
  citySelected.value = '自定义'
  scenarioId.value = 'negotiated'
}

onMounted(() => {
  addRecentTool('labor-severance-calculator')
})
</script>
