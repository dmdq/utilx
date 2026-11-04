<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <CigaretteOff class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">戒烟账本</h1>
          <p class="text-sm text-muted-foreground mt-1">戒烟天数打卡 · 省了多少钱 · 健康恢复时间线，复吸重开也算数</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线戒烟计算器与戒烟打卡账本：填入戒烟开始日期、烟价、每天包数与每包支数，自动累计戒烟天数、已省金额（相当于每天省多少元）与少抽支数；
        按广为引用的戒烟恢复时间线逐条标记健康里程碑——20 分钟心率血压回落、12 小时一氧化碳清除、肺功能改善、冠心病风险减半等，并按"每支烟约 11 分钟"的口径估算夺回的寿命。
        支持复吸重开重新计天，所有数据只保存在这台设备的浏览器里，不上传任何数据。
      </p>
    </div>

    <!-- 正向语气说明条 -->
    <div class="bg-green-500/10 border border-green-500/20 rounded-lg p-3.5 mb-6 flex items-start gap-2">
      <HeartPulse class="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
      <p class="text-sm text-foreground leading-relaxed">
        这个页面记录的是你已经赢下的部分——每一分钟的清爽都是真实的。数据只存在这台设备上，随时可导出。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左栏：设置与操作 -->
      <div class="space-y-6">
        <!-- 首次设置 / 账本设置 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <CalendarClock class="w-5 h-5 mr-2 text-primary" /> {{ hasRecord ? '账本设置' : '开始你的戒烟账本' }}
          </h2>

          <p
            v-if="!hasRecord"
            class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5"
          >
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>只需要四件小事：哪天开始戒、烟多少钱一包、每天抽几包、一包多少支。保存后账本立即开始计天，数据只存在这台设备上。</span>
          </p>

          <!-- 摘要视图 -->
          <template v-if="hasRecord && !editing">
            <dl class="space-y-2 text-sm">
              <div class="flex items-center justify-between">
                <dt class="text-muted-foreground">戒烟开始</dt>
                <dd class="text-foreground font-medium font-mono">{{ config.startDate }}</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-muted-foreground">烟价</dt>
                <dd class="text-foreground font-medium">{{ yuanTextOf(config.pricePerPack) }} 元/包</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-muted-foreground">每天包数</dt>
                <dd class="text-foreground font-medium">{{ yuanTextOf(config.packsPerDay) }} 包</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-muted-foreground">每包支数</dt>
                <dd class="text-foreground font-medium">{{ config.perPack }} 支</dd>
              </div>
            </dl>
            <p
              v-if="startAnomaly"
              class="text-xs leading-relaxed p-2.5 rounded bg-amber-500/10 text-foreground flex items-start gap-1.5"
            >
              <Info class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>检测到开始日期晚于今天（可能被手动改动过），账本已按今天重新计天，可编辑设置修正开始日期。</span>
            </p>
            <button
              @click="startEdit"
              class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
            >
              编辑设置
            </button>
          </template>

          <!-- 表单视图（首次建档 / 编辑） -->
          <template v-else>
            <div class="space-y-3">
              <div>
                <label class="block text-xs text-muted-foreground mb-1" for="qs-start-date">戒烟开始日期</label>
                <input
                  id="qs-start-date"
                  v-model="form.startDate"
                  type="date"
                  class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-muted-foreground mb-1" for="qs-price">烟价（元/包）</label>
                  <input
                    id="qs-price"
                    v-model.number="form.pricePerPack"
                    type="number"
                    min="0.5"
                    step="0.5"
                    class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label class="block text-xs text-muted-foreground mb-1" for="qs-packs">每天包数</label>
                  <input
                    id="qs-packs"
                    v-model.number="form.packsPerDay"
                    type="number"
                    min="0.5"
                    max="10"
                    step="0.5"
                    class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div class="col-span-2">
                  <label class="block text-xs text-muted-foreground mb-1" for="qs-per-pack">每包支数</label>
                  <input
                    id="qs-per-pack"
                    v-model.number="form.perPack"
                    type="number"
                    min="1"
                    max="200"
                    step="1"
                    class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            </div>
            <p
              v-if="formError"
              class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5"
            >
              <Info class="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{{ formError }}</span>
            </p>
            <button
              @click="saveForm"
              class="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 rounded-lg text-sm font-medium text-primary-foreground transition"
            >
              {{ hasRecord ? '保存设置' : '保存并开始记账' }}
            </button>
            <button
              v-if="hasRecord"
              @click="cancelEdit"
              class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
            >
              取消
            </button>
          </template>
        </div>

        <!-- 账本操作 -->
        <div v-if="hasRecord" class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <RefreshCw class="w-5 h-5 mr-2 text-primary" /> 账本操作
          </h2>

          <button
            @click="copySummary"
            class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            复制小结（导出本机数据）
          </button>
          <p v-if="copyState" class="text-xs leading-relaxed px-2.5 text-muted-foreground">
            {{ copyState === 'ok' ? '小结已复制到剪贴板，可粘贴保存或发给朋友。' : '复制失败：浏览器未授权剪贴板，可截图保存本页小结。' }}
          </p>

          <button
            @click="handleRestart"
            class="w-full px-4 py-2.5 border rounded-lg text-sm font-medium transition"
            :class="confirmMode === 'restart'
              ? 'bg-red-500/10 border-red-500/30 text-red-600'
              : 'bg-muted hover:bg-muted/80 border-border text-foreground'"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" />
            {{ confirmMode === 'restart' ? '再点一次确认：从今天重新计天' : '复吸了？重设开始日期，重新计天' }}
          </button>

          <button
            @click="handleClear"
            class="w-full px-4 py-2.5 border rounded-lg text-sm font-medium transition"
            :class="confirmMode === 'clear'
              ? 'bg-red-500/10 border-red-500/30 text-red-600'
              : 'bg-muted hover:bg-muted/80 border-border text-muted-foreground'"
          >
            <Trash2 class="w-4 h-4 inline mr-1.5 -mt-0.5" />
            {{ confirmMode === 'clear' ? '再点一次确认：永久清空本机数据' : '清空数据（删除本机账本）' }}
          </button>

          <p class="text-xs leading-relaxed p-2.5 rounded bg-green-500/10 text-foreground flex items-start gap-1.5">
            <HeartPulse class="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>重新开始也算数——绝大多数最终戒烟成功的人都经历过不止一次尝试，账本陪你重来；此前最长的一次已记录在戒烟天数卡片里。</span>
          </p>
        </div>
      </div>

      <!-- 右栏：账本展示（占两列） -->
      <div class="lg:col-span-2 space-y-6">
        <template v-if="hasRecord">
          <!-- 三大核心卡 -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="bg-card border border-border rounded-lg p-5 text-center flex flex-col items-center justify-center">
              <p class="text-xs text-muted-foreground flex items-center gap-1">
                <CalendarClock class="w-3.5 h-3.5 text-primary" /> 戒烟天数
              </p>
              <p class="text-5xl font-bold text-primary mt-2 tabular-nums">{{ days }}</p>
              <p class="text-xs text-muted-foreground mt-2">天 · 从 {{ effectiveStart }} 起算（当天算第 1 天）</p>
              <p v-if="bestDays > days" class="text-xs text-muted-foreground/80 mt-1">此前最长一次坚持了 {{ bestDays }} 天</p>
            </div>
            <div class="bg-primary/5 border border-primary/20 rounded-lg p-5 text-center flex flex-col items-center justify-center">
              <p class="text-xs text-muted-foreground flex items-center gap-1">
                <Coins class="w-3.5 h-3.5 text-primary" /> 已省金额
              </p>
              <p class="text-5xl font-bold text-primary mt-2 tabular-nums">¥{{ moneySavedText }}</p>
              <p class="text-xs text-muted-foreground mt-2">按 {{ yuanTextOf(config.pricePerPack) }} 元/包 × {{ yuanTextOf(config.packsPerDay) }} 包/天累计</p>
              <span class="inline-block mt-2 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-[10px] font-medium border border-green-500/20">
                相当于每天省 {{ moneyPerDayText }} 元
              </span>
            </div>
            <div class="bg-card border border-border rounded-lg p-5 text-center flex flex-col items-center justify-center">
              <p class="text-xs text-muted-foreground flex items-center gap-1">
                <CigaretteOff class="w-3.5 h-3.5 text-primary" /> 少抽支数
              </p>
              <p class="text-4xl sm:text-5xl font-bold text-foreground mt-2 tabular-nums">{{ cigarettesAvoided }}</p>
              <p class="text-xs text-muted-foreground mt-2">支 · 按 {{ config.perPack }} 支/包 × {{ yuanTextOf(config.packsPerDay) }} 包/天估算</p>
            </div>
          </div>

          <!-- 夺回的时间 -->
          <div class="bg-card border border-border rounded-lg p-5 flex items-center gap-4">
            <div class="p-2.5 bg-green-500/10 rounded-lg flex-shrink-0">
              <HeartPulse class="w-6 h-6 text-green-600" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-foreground">
                夺回的时间 <span class="text-xs text-muted-foreground font-normal">· 夺回的寿命估算</span>
              </p>
              <p class="text-3xl font-bold text-green-600 mt-1 tabular-nums">
                约 {{ lifeBackDays >= 1 ? `${lifeBackText} 天` : `${lifeBackHoursText} 小时` }}
              </p>
              <p class="text-xs text-muted-foreground mt-1 leading-relaxed">
                按广为引用的流行病学估算"每支烟约折损 11 分钟寿命"换算：少抽的 {{ cigarettesAvoided }} 支 ≈ {{ lifeBackMinutes }} 分钟。
                口径仅供参考，个体差异大。
              </p>
            </div>
          </div>

          <!-- 健康恢复时间线 -->
          <div class="bg-card border border-border rounded-lg p-6">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h2 class="text-lg font-semibold flex items-center">
                  <HeartPulse class="w-5 h-5 mr-2 text-primary" /> 健康恢复时间线
                </h2>
                <p class="text-xs text-muted-foreground mt-1">参考 WHO 与公卫科普口径，个体差异大，仅作激励参考，不构成医学建议</p>
              </div>
              <button
                @click="refreshNow"
                title="按今天重新计算"
                class="px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition flex-shrink-0"
              >
                <RefreshCw class="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> 刷新
              </button>
            </div>

            <div
              v-if="!nextMilestone"
              class="mt-4 p-3.5 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-foreground flex items-start gap-2"
            >
              <CheckCircle class="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>15 年里程碑也达成了：冠心病风险已与从不吸烟者持平。这张时间线的每一条，你都亲自走完了。</span>
            </div>

            <div class="relative mt-5">
              <div class="absolute left-[11px] top-2 bottom-2 w-px bg-border" aria-hidden="true"></div>
              <ol class="space-y-4">
                <li v-for="m in timelineItems" :key="m.label" class="relative pl-9">
                  <span class="absolute left-0 top-0 flex items-center justify-center w-6 h-6">
                    <CheckCircle v-if="m.achieved" class="w-6 h-6 text-green-500 bg-card rounded-full" />
                    <i
                      v-else
                      class="block w-3.5 h-3.5 rounded-full border-2 bg-card"
                      :class="isNextMilestone(m) ? 'border-primary' : 'border-border'"
                    ></i>
                  </span>
                  <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p
                      class="text-sm font-medium"
                      :class="m.achieved ? 'text-foreground' : isNextMilestone(m) ? 'text-primary' : 'text-muted-foreground'"
                    >
                      {{ m.label }}
                    </p>
                    <span
                      v-if="m.achieved"
                      class="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 text-[10px] font-medium border border-green-500/20"
                    >
                      {{ timelineDate(m) }} 达成
                    </span>
                    <span
                      v-else-if="isNextMilestone(m)"
                      class="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium border border-primary/20"
                    >
                      还差 {{ nextMilestone.remainingDays }} 天 · 预计 {{ timelineDate(m) }}
                    </span>
                    <span
                      v-else
                      class="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] border border-border"
                    >
                      预计 {{ timelineDate(m) }}
                    </span>
                  </div>
                  <p class="text-xs mt-0.5 leading-relaxed" :class="isNextMilestone(m) ? 'text-foreground/80' : 'text-muted-foreground'">
                    {{ m.desc }}
                  </p>
                </li>
              </ol>
            </div>
          </div>
        </template>

        <!-- 未建档占位 -->
        <div v-else class="bg-card border border-border rounded-lg p-10 text-center">
          <CigaretteOff class="w-10 h-10 text-primary/30 mx-auto" />
          <p class="text-sm font-medium text-muted-foreground mt-3">先在左侧填好开始日期、烟价与烟量</p>
          <p class="text-xs text-muted-foreground/70 mt-1">保存后这里会显示戒烟天数、已省金额、少抽支数与健康恢复时间线</p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>戒烟账本是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          戒烟账本是一款纯本地运行的戒烟计算器与戒烟打卡工具。填入戒烟开始日期、烟价（元/包）、每天包数与每包支数后，
          页面自动累计戒烟天数、已省金额（并提示"相当于每天省多少元"）与少抽支数；同时按广为引用的戒烟恢复时间线
          （参考 WHO 与公卫科普口径）逐条标记健康里程碑的达成情况，下一个里程碑会直接告诉你"还差 N 天"。
          工具还会按"每支烟约折损 11 分钟寿命"的流行病学口径估算"夺回的时间"。所有数据只保存在你这台设备的浏览器
          localStorage 里，不上传、不需要注册；复吸了随时点"重新开始计天"，重新开始也算数。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">适合哪些场景？</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>刚戒烟最难熬的前几天：看着"20 分钟心率回落、12 小时一氧化碳清除"逐条变绿，给身体即时正反馈。</li>
          <li>想知道"戒烟省了多少钱"：按你自己的烟价与烟量累计，戒烟一年省多少一目了然。</li>
          <li>反复戒、反复吸的人：账本支持重开计天，把每一次尝试都记录成练习而不是失败。</li>
          <li>想给家人一个交代：你少抽的每一支，也是家人少吸的每一口二手烟。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>戒烟 20 分钟后身体发生什么？</h2>
        <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
          本页时间线采用世卫组织（WHO）与各国公共卫生机构科普材料中广为引用的恢复口径：停止吸烟 20 分钟后，心率与血压开始回落、手脚温度恢复；
          12 小时后血液中一氧化碳浓度降至不吸烟者的正常水平；2 周-3 个月血液循环改善、肺功能提升；1-9 个月支气管纤毛恢复，咳嗽与气短减少；
          1 年患冠心病的风险降到吸烟者的一半；5 年脑卒中风险降至与不吸烟者持平；10 年肺癌风险约为吸烟者的一半；15 年冠心病风险与从不吸烟者相同。
        </p>
        <p class="text-sm text-muted-foreground leading-relaxed">
          需要说明的是：这是人群统计口径，个体差异大，恢复速度与吸烟年限、基线健康状况都有关系，本页时间线仅作激励参考，不构成医学建议。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>戒烟一年省多少钱？算一题</h2>
        <p class="text-sm text-muted-foreground leading-relaxed">
          以每包 25 元、每天 1 包、每包 20 支为例：戒烟一年（365 天）= 365 × 1 × 25 = 9125 元，同时少抽 365 × 20 = 7300 支烟；
          按"每支烟约 11 分钟"的流行病学估算换算，相当于夺回约 55.8 天的清醒时间。换成每天半包、每包 12.5 元，
          一年也能省下 365 × 0.5 × 12.5 = 2281.25 元。把你自己的烟价和烟量填进上方账本，数字会随天数每天自动增长。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>复吸了怎么办？</h2>
        <p class="text-sm text-muted-foreground leading-relaxed">
          一支烟不代表失败，更不需要把账本清空重来——直接点"复吸了？重设开始日期"，账本从今天重新计天，此前最长的一次坚持天数会被保留记录。
          公卫科普中常引用的口径是：大多数最终戒烟成功的人都平均经历了多次尝试（常见说法从数次到 30 次不等），把复吸当作练习而不是污点，
          是行为科学里更接近成功的姿态。重新开始也算数。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>二手烟与家人</h2>
        <p class="text-sm text-muted-foreground leading-relaxed">
          戒烟从来不只是自己的事：二手烟没有"安全暴露水平"，家中有人吸烟时，家人（尤其是儿童）患呼吸道感染、哮喘与中耳炎的风险会明显上升，
          不吸烟的配偶患肺癌风险也会升高。你在账本里少抽的每一支烟，同时也是家人少吸的每一口烟。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>戒烟门诊和替代疗法</h2>
        <p class="text-sm text-muted-foreground leading-relaxed">
          烟瘾是成瘾行为，只靠意志硬扛并不总是最优解：各地医院的戒烟门诊可提供行为干预与随访，尼古丁贴片、口香糖等替代疗法能明显提高戒烟成功率——
          需要时请咨询专业医生，本页工具不构成医学建议。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">戒烟 20 分钟后身体会发生什么？</h3>
            <p class="text-sm text-muted-foreground mt-1">按 WHO 与公卫科普中广为引用的口径：停止吸烟 20 分钟后心率与血压开始回落，12 小时后血液一氧化碳浓度恢复正常，之后依次是肺功能改善、纤毛恢复、冠心病风险减半（1 年）、脑卒中风险持平（5 年）、肺癌风险减半（10 年）、冠心病风险等同不吸烟者（15 年）。个体差异大，仅作参考。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">戒烟一年能省多少钱？</h3>
            <p class="text-sm text-muted-foreground mt-1">以每包 25 元、每天 1 包计：365 × 1 × 25 = 9125 元，同时少抽约 7300 支；每天半包、每包 12.5 元的轻量吸烟者一年也能省约 2281 元。在账本里填入自己的烟价与烟量即可自动累计。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">复吸了，账本要清空吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不用清空。点"重设开始日期，重新计天"即可从今天重新累计，此前的最长坚持天数会保留。多数成功戒烟者平均都经历过多次尝试，重新开始也算数。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">戒烟账本的数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有数据只保存在你这台设备的浏览器 localStorage 里，不上传服务器、不需要注册；可用"复制小结"导出，也可随时一键清空本机数据。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'quit-smoking-calculator'" :category="'health'" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  CigaretteOff, CalendarClock, Coins, HeartPulse, CheckCircle,
  ChevronUp, ChevronDown, Info, RefreshCw, Trash2
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '戒烟账本 - 戒烟计算器：戒烟打卡、戒烟好处时间线与省了多少钱',
  description: '免费在线戒烟计算器与戒烟打卡账本：自动统计戒烟天数、戒烟省了多少钱、少抽支数，展示戒烟好处时间线（20 分钟心率回落到 15 年风险归零）与夺回寿命估算，支持复吸重开重新计天，吸烟花费一目了然，数据本地保存不上传',
  keywords: '戒烟计算器,戒烟好处时间线,戒烟省了多少钱,戒烟打卡,吸烟花费计算',
  author: '有条工具',
  ogTitle: '戒烟账本 - 戒烟计算器：戒烟打卡、戒烟好处时间线与省了多少钱 | 有条工具',
  ogDescription: '戒烟天数、省钱账本与健康恢复时间线，复吸重开也算数，数据只存本机。',
  ogUrl: 'https://www.util.cn/tools/quit-smoking-calculator',
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
          name: '戒烟账本',
          url: 'https://www.util.cn/tools/quit-smoking-calculator',
          applicationCategory: 'HealthApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['戒烟天数打卡', '省钱账本与每日节省金额', '少抽支数统计', '健康恢复时间线（WHO 与公卫科普口径）', '夺回寿命估算', '复吸重开重新计天', '本地存储不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '健康工具', item: 'https://www.util.cn/health/' },
            { '@type': 'ListItem', position: 3, name: '戒烟账本', item: 'https://www.util.cn/tools/quit-smoking-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '戒烟20分钟后身体会发生什么？',
              acceptedAnswer: { '@type': 'Answer', text: '按WHO与公卫科普中广为引用的口径：停止吸烟20分钟后心率与血压开始回落，12小时后血液一氧化碳浓度恢复正常，之后依次是肺功能改善、纤毛恢复、1年冠心病风险减半、5年脑卒中风险持平、10年肺癌风险减半、15年冠心病风险等同不吸烟者。个体差异大，仅作参考。' }
            },
            {
              '@type': 'Question',
              name: '戒烟一年能省多少钱？',
              acceptedAnswer: { '@type': 'Answer', text: '以每包25元、每天1包计：365×1×25=9125元，同时少抽约7300支；每天半包、每包12.5元的轻量吸烟者一年也能省约2281元。在账本里填入自己的烟价与烟量即可自动累计。' }
            },
            {
              '@type': 'Question',
              name: '复吸了，账本要清空吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不用清空。点"重设开始日期，重新计天"即可从今天重新累计，此前的最长坚持天数会保留。多数成功戒烟者平均都经历过多次尝试，重新开始也算数。' }
            },
            {
              '@type': 'Question',
              name: '戒烟账本的数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有数据只保存在你这台设备的浏览器localStorage里，不上传服务器、不需要注册；可用"复制小结"导出，也可随时一键清空本机数据。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const MS_PER_DAY = 86400000
const MIN_PER_CIG = 11 // 每支烟约折损 11 分钟寿命：广为引用的流行病学估算（常被追溯到 BMJ 2000 年对 Doll-Hill 队列数据的换算），个体差异大

// 'yyyy-mm-dd' → UTC 当日零点时间戳（统一 UTC 日期口径，避免时区漂移；非法输入返回 NaN）
function utcDayTs(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''))
  if (!m) return NaN
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

// 防御：开始日期非法或被改动到未来时，钳制回今天（负数天数保护），合法日期原样返回
function streakProtectionOf(startIso, todayIso) {
  const todayTs = utcDayTs(todayIso)
  if (!Number.isFinite(todayTs)) return todayIso
  const startTs = utcDayTs(startIso)
  if (!Number.isFinite(startTs) || startTs > todayTs) return todayIso
  return startIso
}

// 戒烟天数：开始日算第 1 天（当天 = 1）；开始日期在未来时返回 0（防御负数）
function quitDaysOf(startIso, nowIso) {
  const startTs = utcDayTs(startIso)
  const nowTs = utcDayTs(nowIso)
  if (!Number.isFinite(startTs) || !Number.isFinite(nowTs)) return 0
  const diff = Math.floor((nowTs - startTs) / MS_PER_DAY)
  return diff < 0 ? 0 : diff + 1
}

// 保留 2 位小数
function round2(n) {
  return Math.round(n * 100) / 100
}

// 已省金额 = 天数 × 每天包数 × 烟价（2 位小数）
function moneySavedOf(days, pricePerPack, packsPerDay) {
  return round2(days * packsPerDay * pricePerPack)
}

// 少抽支数 = 天数 × 每天包数 × 每包支数（取整）
function cigarettesAvoidedOf(days, packsPerDay, perPack) {
  return Math.round(days * packsPerDay * perPack)
}

// 夺回的寿命（天，1 位小数）= 少抽支数 × 11 分钟/支 ÷ 1440
// （11 分钟/支为广为引用的流行病学估算口径，个体差异大，仅作激励参考）
function lifeBackOf(days, packsPerDay, perPack) {
  const cigarettes = cigarettesAvoidedOf(days, packsPerDay, perPack)
  return Math.round((cigarettes * MIN_PER_CIG / 1440) * 10) / 10
}

// 夺回的寿命（小时，1 位小数）：不足 1 天时用小时更直观
function lifeBackHoursOf(days, packsPerDay, perPack) {
  const cigarettes = cigarettesAvoidedOf(days, packsPerDay, perPack)
  return Math.round((cigarettes * MIN_PER_CIG / 60) * 10) / 10
}

// 健康恢复时间线（参考 WHO 与公卫科普口径，个体差异大）。
// 区间型里程碑取区间下限作为达成阈值：进入该阶段即视为已达成，区间完整含义写在 label 里
const TIMELINE_MILESTONES = [
  { label: '20 分钟', days: 20 / 1440, desc: '心率与血压开始回落，手脚温度恢复' },
  { label: '12 小时', days: 12 / 24, desc: '血液中一氧化碳浓度降至不吸烟者的正常水平' },
  { label: '2 周 - 3 个月', days: 14, desc: '血液循环改善，肺功能明显提升' },
  { label: '1 - 9 个月', days: 30, desc: '支气管纤毛恢复，咳嗽和气短减少' },
  { label: '1 年', days: 365, desc: '患冠心病的风险降到吸烟者的一半' },
  { label: '5 年', days: 1825, desc: '脑卒中风险降至与不吸烟者持平' },
  { label: '10 年', days: 3650, desc: '肺癌风险约为吸烟者的一半' },
  { label: '15 年', days: 5475, desc: '冠心病风险与从不吸烟者相同' }
]

// 按戒烟天数标记每个里程碑是否已达成：{ label, days, desc, achieved }
function timelineOf(days) {
  return TIMELINE_MILESTONES.map((m) => ({ ...m, achieved: days >= m.days }))
}

// 下一个未达成里程碑与剩余天数（currentDays 缺省按 0 起算；全部达成时返回 null）
function nextMilestoneOf(timeline, currentDays) {
  const next = timeline.find((m) => !m.achieved)
  if (!next) return null
  const passed = Number.isFinite(currentDays) ? currentDays : 0
  return { ...next, remainingDays: Math.max(1, Math.ceil(next.days - passed)) }
}

// 'yyyy-mm-dd' + n 天 → 'yyyy-mm-dd'（UTC 口径，非法输入返回空串）
function addDaysIso(iso, n) {
  const ts = utcDayTs(iso)
  if (!Number.isFinite(ts)) return ''
  const d = new Date(ts + n * MS_PER_DAY)
  const p = (x) => String(x).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`
}

// 今天（用户本地时区的 yyyy-mm-dd，仅限浏览器环境调用）
function todayIsoOf() {
  const d = new Date()
  const p = (x) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// 金额文案：最多 2 位小数，去掉末尾多余的 0（2500 → '2500'，25.5 → '25.5'）
function yuanTextOf(n) {
  const s = round2(Number(n) || 0).toFixed(2)
  return s.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
}

// ---------- 浏览器存储（核心数据，均带 try/catch；读只在 onMounted） ----------
const STORAGE_KEY = 'quit-smoking-calculator:v1'

function defaultConfig() {
  return { startDate: '', pricePerPack: 25, packsPerDay: 1, perPack: 20 }
}

function sanitizeConfig(raw) {
  if (!raw || typeof raw !== 'object') return null
  const okDate = typeof raw.startDate === 'string' && Number.isFinite(utcDayTs(raw.startDate))
  const okPrice = Number.isFinite(raw.pricePerPack) && raw.pricePerPack >= 0.1
  const okPacks = Number.isFinite(raw.packsPerDay) && raw.packsPerDay >= 0.5 && raw.packsPerDay <= 10
  const okPer = Number.isInteger(raw.perPack) && raw.perPack >= 1 && raw.perPack <= 200
  if (!(okDate && okPrice && okPacks && okPer)) return null
  return {
    startDate: raw.startDate,
    pricePerPack: round2(raw.pricePerPack),
    packsPerDay: raw.packsPerDay,
    perPack: raw.perPack
  }
}

function persistLedger() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      v: 1,
      startDate: config.value.startDate,
      pricePerPack: config.value.pricePerPack,
      packsPerDay: config.value.packsPerDay,
      perPack: config.value.perPack,
      bestDays: bestDays.value,
      savedAt: nowIso.value
    }))
  } catch {
    // 存储不可用（隐私模式/配额满）时账本仍在本次会话内可用
  }
}

// ---------- 页面状态 ----------
const config = ref(defaultConfig())
const bestDays = ref(0)
const hasRecord = ref(false)
const editing = ref(false)
const nowIso = ref('')
const seoContentVisible = ref(true)

const form = reactive({ startDate: '', pricePerPack: 25, packsPerDay: 1, perPack: 20 })
const formError = ref('')
const copyState = ref('')
const confirmMode = ref(null) // 'restart' | 'clear' | null（两段式确认）
let confirmTimer = null

// ---------- 派生数据（全部走纯函数） ----------
// 防御后的生效开始日期：非法或未来日期一律按今天处理
const effectiveStart = computed(() => streakProtectionOf(config.value.startDate, nowIso.value))
const startAnomaly = computed(() => hasRecord.value && effectiveStart.value !== config.value.startDate)
const days = computed(() => quitDaysOf(effectiveStart.value, nowIso.value))
const moneySaved = computed(() => moneySavedOf(days.value, config.value.pricePerPack, config.value.packsPerDay))
const moneyPerDay = computed(() => moneySavedOf(1, config.value.pricePerPack, config.value.packsPerDay))
const cigarettesAvoided = computed(() => cigarettesAvoidedOf(days.value, config.value.packsPerDay, config.value.perPack))
const lifeBackDays = computed(() => lifeBackOf(days.value, config.value.packsPerDay, config.value.perPack))
const lifeBackHours = computed(() => lifeBackHoursOf(days.value, config.value.packsPerDay, config.value.perPack))
const lifeBackMinutes = computed(() => cigarettesAvoided.value * MIN_PER_CIG)
const timelineItems = computed(() => timelineOf(days.value))
const nextMilestone = computed(() => nextMilestoneOf(timelineItems.value, days.value))

const moneySavedText = computed(() => moneySaved.value.toFixed(2))
const moneyPerDayText = computed(() => yuanTextOf(moneyPerDay.value))
const lifeBackText = computed(() => lifeBackDays.value.toFixed(1))
const lifeBackHoursText = computed(() => lifeBackHours.value.toFixed(1))

function isNextMilestone(m) {
  return !!nextMilestone.value && nextMilestone.value.label === m.label
}

function timelineDate(m) {
  return addDaysIso(effectiveStart.value, Math.floor(m.days))
}

// ---------- 表单 ----------
function validateForm() {
  if (!Number.isFinite(utcDayTs(form.startDate))) return '请选择有效的戒烟开始日期'
  if (!(Number(form.pricePerPack) >= 0.1)) return '烟价需大于 0 元'
  if (!(Number(form.packsPerDay) >= 0.5)) return '每天包数至少 0.5 包'
  if (!(Number(form.perPack) >= 1 && Number(form.perPack) <= 200)) return '每包支数需在 1-200 支之间'
  return ''
}

function fillFormFromConfig() {
  form.startDate = config.value.startDate || nowIso.value
  form.pricePerPack = config.value.pricePerPack
  form.packsPerDay = config.value.packsPerDay
  form.perPack = config.value.perPack
}

function startEdit() {
  disarmConfirm()
  fillFormFromConfig()
  formError.value = ''
  editing.value = true
}

function cancelEdit() {
  editing.value = false
  formError.value = ''
}

function saveForm() {
  const err = validateForm()
  if (err) {
    formError.value = err
    return
  }
  formError.value = ''
  config.value = {
    startDate: form.startDate,
    pricePerPack: round2(Number(form.pricePerPack)),
    packsPerDay: Number(form.packsPerDay),
    perPack: Math.round(Number(form.perPack))
  }
  if (hasRecord.value && days.value > bestDays.value) bestDays.value = days.value
  hasRecord.value = true
  editing.value = false
  persistLedger()
}

// ---------- 操作（两段式确认：点一次进入待确认，再点一次执行，5 秒后自动复位） ----------
function disarmConfirm() {
  confirmMode.value = null
  if (confirmTimer) {
    clearTimeout(confirmTimer)
    confirmTimer = null
  }
}

function armConfirm(mode) {
  if (confirmMode.value === mode) {
    disarmConfirm()
    if (mode === 'restart') doRestart()
    else doClear()
    return
  }
  confirmMode.value = mode
  if (confirmTimer) clearTimeout(confirmTimer)
  confirmTimer = setTimeout(disarmConfirm, 5000)
}

function handleRestart() {
  armConfirm('restart')
}

function handleClear() {
  armConfirm('clear')
}

// 复吸重开：最长纪录归档后，开始日期重设为今天，重新计天
function doRestart() {
  if (days.value > bestDays.value) bestDays.value = days.value
  config.value = { ...config.value, startDate: nowIso.value }
  editing.value = false
  persistLedger()
}

// 清空数据：删除本机账本，回到首次设置引导
function doClear() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // 读取侧下次会做完整性校验，这里尽力删除即可
  }
  hasRecord.value = false
  editing.value = false
  bestDays.value = 0
  config.value = defaultConfig()
  form.startDate = nowIso.value
}

function refreshNow() {
  nowIso.value = todayIsoOf()
}

async function copySummary() {
  const reached = timelineItems.value.filter((m) => m.achieved).map((m) => m.label).join('、') || '暂无'
  const lines = [
    `戒烟账本小结（${nowIso.value}）`,
    `戒烟开始：${effectiveStart.value}（第 ${days.value} 天）`,
    `已省金额：${moneySavedText.value} 元（相当于每天省 ${moneyPerDayText.value} 元）`,
    `少抽支数：${cigarettesAvoided.value} 支`,
    `夺回的时间：约 ${lifeBackDays.value >= 1 ? `${lifeBackText.value} 天` : `${lifeBackHoursText.value} 小时`}`,
    `已达成里程碑：${reached}`,
    nextMilestone.value
      ? `下一个里程碑：${nextMilestone.value.label}（还差 ${nextMilestone.value.remainingDays} 天）`
      : '全部里程碑已达成！'
  ]
  try {
    await navigator.clipboard.writeText(lines.join('\n'))
    copyState.value = 'ok'
  } catch {
    copyState.value = 'fail'
  }
  setTimeout(() => {
    copyState.value = ''
  }, 4000)
}

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

onMounted(() => {
  nowIso.value = todayIsoOf()
  form.startDate = nowIso.value

  // 本机账本读取（try/catch：隐私模式或脏数据时回到首次设置）
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      const clean = sanitizeConfig(data)
      if (clean) {
        config.value = clean
        hasRecord.value = true
        bestDays.value = Number.isFinite(data.bestDays) && data.bestDays >= 0 ? Math.floor(data.bestDays) : 0
      }
    }
  } catch {
    // JSON 解析失败或存储不可用：保持未建档状态
  }

  addRecentTool('quit-smoking-calculator')
})

onBeforeUnmount(() => {
  disarmConfirm()
})
</script>
