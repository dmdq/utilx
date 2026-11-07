<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Plane class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">差旅费计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">机关标准（伙食 100 / 交通 80 / 住宿城市档）与企业自定义双模式，首末日折算可关，分项明细一键复制</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线差旅费计算器（出差报销测算工具）：输入出发 / 返回日期自动算天数（间隔 + 1）与住宿晚数，
        支持<b>机关事业单位模式</b>——按财政部现行常列口径：伙食补助费 100 元 / 人·天、市内交通费 80 元 / 人·天、
        住宿费按城市档限额（一线 / 一般地区 × 部级 / 司局级 / 处级及以下示例档位表）；
        以及<b>企业自定义模式</b>——三项日标准 + 实报金额，实报超标准按标准计、差额个人承担红标提示。
        首末日 75% 折算开关可关（财政部现行口径为按自然天数整计，75% 是外企 / GSA per diem 通行做法，以本单位制度为准）。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Plane class="w-5 h-5 mr-2 text-primary" /> 出差信息与报销模式
        </h2>

        <!-- 模式 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">报销模式</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              @click="mode = 'gov'"
              class="py-2.5 rounded-lg text-sm font-medium border transition"
              :class="mode === 'gov' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >机关事业单位</button>
            <button
              type="button"
              @click="mode = 'corp'"
              class="py-2.5 rounded-lg text-sm font-medium border transition"
              :class="mode === 'corp' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >企业自定义</button>
          </div>
        </div>

        <!-- 日期 -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="te-depart" class="block text-sm font-medium text-foreground mb-2">出发日期</label>
            <input
              id="te-depart"
              v-model="departDate"
              type="date"
              class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label for="te-return" class="block text-sm font-medium text-foreground mb-2">返回日期</label>
            <input
              id="te-return"
              v-model="returnDate"
              type="date"
              class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <!-- 天数与晚数 -->
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label for="te-days" class="block text-sm font-medium text-foreground mb-2">天数</label>
            <input
              id="te-days"
              :value="daysText"
              type="text"
              readonly
              aria-readonly="true"
              class="w-full px-3 py-2 border border-border bg-muted/40 rounded-lg text-foreground text-sm text-right"
            />
          </div>
          <div>
            <label for="te-nights" class="block text-sm font-medium text-foreground mb-2">住宿晚数</label>
            <input
              id="te-nights"
              v-model.number="hotelNights"
              type="number"
              min="0"
              step="1"
              class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-[10px] text-muted-foreground/80 leading-relaxed mt-1">默认 = 天数 − 1，可改</p>
          </div>
          <div>
            <label for="te-allow" class="block text-sm font-medium text-foreground mb-2">伙食/交通折算天</label>
            <input
              id="te-allow"
              :value="allowanceDaysText"
              type="text"
              readonly
              aria-readonly="true"
              class="w-full px-3 py-2 border border-border bg-muted/40 rounded-lg text-foreground text-sm text-right"
            />
            <p class="text-[10px] text-muted-foreground/80 leading-relaxed mt-1">按下方首末日开关折算</p>
          </div>
        </div>

        <!-- 首末日 75% 折算开关 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">首末日折算（伙食 / 交通）</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              @click="firstLast75 = true"
              class="py-2 rounded-lg text-sm font-medium border transition"
              :class="firstLast75 ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >首末日各 0.75 天</button>
            <button
              type="button"
              @click="firstLast75 = false"
              class="py-2 rounded-lg text-sm font-medium border transition"
              :class="!firstLast75 ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >整天计发</button>
          </div>
          <p class="text-xs leading-relaxed mt-2 p-2 rounded bg-amber-500/10 text-amber-600 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>财政部现行口径：伙食补助按出差<b>自然（日历）天数、整天数包干</b>计发（出发 / 返回当天各算 1 天）；「首末日各按 75% 折算」源自外企 / GSA per diem 通行做法，仅适用于执行此类制度的单位——请按本单位差旅制度选择，以现行文件与各单位规定为准。</span>
          </p>
        </div>

        <!-- 机关模式专属 -->
        <template v-if="mode === 'gov'">
          <div class="border-t border-border pt-4 space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="te-meal-std" class="block text-sm font-medium text-foreground mb-2">伙食补助标准（元 / 天）</label>
                <input
                  id="te-meal-std"
                  v-model.number="govMealStd"
                  type="number"
                  min="0"
                  step="10"
                  class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label for="te-trans-std" class="block text-sm font-medium text-foreground mb-2">市内交通费标准（元 / 天）</label>
                <input
                  id="te-trans-std"
                  v-model.number="govTransStd"
                  type="number"
                  min="0"
                  step="10"
                  class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <p class="text-[11px] text-muted-foreground leading-relaxed -mt-2 flex items-start gap-1">
              <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>100 元 / 天伙食 + 80 元 / 天市内交通为《中央和国家机关差旅费管理办法》常列值；地方与高校、国企多有各自标准，可直接改数字。</span>
            </p>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="te-city" class="block text-sm font-medium text-foreground mb-2">城市档（示例）</label>
                <select
                  id="te-city"
                  v-model="cityTier"
                  class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="tier1">一线城市示例（北京 / 上海等）</option>
                  <option value="general">一般地区示例</option>
                </select>
              </div>
              <div>
                <label for="te-rank" class="block text-sm font-medium text-foreground mb-2">人员档次</label>
                <select
                  id="te-rank"
                  v-model="rankTier"
                  class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="chushi">处级及以下</option>
                  <option value="siju">司局级</option>
                  <option value="buzhang">部级</option>
                </select>
              </div>
            </div>
            <div>
              <label for="te-hotel-limit" class="block text-sm font-medium text-foreground mb-2">住宿费限额（元 / 晚，限额内凭票据实报销）</label>
              <input
                id="te-hotel-limit"
                v-model.number="hotelLimit"
                type="number"
                min="0"
                step="50"
                class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p class="text-[10px] text-muted-foreground/80 leading-relaxed mt-1">
                选城市档与人员档次后自动填入示例限额（一线 500 / 650 / 1100，一般地区 350 / 480 / 800）；各地分档另有旺季上浮，以现行文件与各单位规定为准，可直接改。
              </p>
            </div>
          </div>
        </template>

        <!-- 企业模式专属 -->
        <template v-else>
          <div class="border-t border-border pt-4 space-y-4">
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label for="te-c-meal" class="block text-sm font-medium text-foreground mb-2">伙食（元 / 天）</label>
                <input
                  id="te-c-meal"
                  v-model.number="corpMealStd"
                  type="number"
                  min="0"
                  step="10"
                  placeholder="如 80"
                  class="w-full px-2.5 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label for="te-c-trans" class="block text-sm font-medium text-foreground mb-2">交通（元 / 天）</label>
                <input
                  id="te-c-trans"
                  v-model.number="corpTransStd"
                  type="number"
                  min="0"
                  step="10"
                  placeholder="如 50"
                  class="w-full px-2.5 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label for="te-c-hotel" class="block text-sm font-medium text-foreground mb-2">住宿（元 / 晚）</label>
                <input
                  id="te-c-hotel"
                  v-model.number="corpHotelStd"
                  type="number"
                  min="0"
                  step="50"
                  placeholder="如 400"
                  class="w-full px-2.5 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <p class="text-sm font-medium text-foreground">实报金额（选填；留空按标准计，实报超标准按标准计）</p>
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label for="te-a-meal" class="text-xs text-muted-foreground mb-1 block">伙食实报</label>
                <input
                  id="te-a-meal"
                  v-model.number="corpMealActual"
                  type="number"
                  min="0"
                  step="10"
                  placeholder="留空按标准"
                  class="w-full px-2.5 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label for="te-a-trans" class="text-xs text-muted-foreground mb-1 block">交通实报</label>
                <input
                  id="te-a-trans"
                  v-model.number="corpTransActual"
                  type="number"
                  min="0"
                  step="10"
                  placeholder="留空按标准"
                  class="w-full px-2.5 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label for="te-a-hotel" class="text-xs text-muted-foreground mb-1 block">住宿实报</label>
                <input
                  id="te-a-hotel"
                  v-model.number="corpHotelActual"
                  type="number"
                  min="0"
                  step="50"
                  placeholder="留空按标准"
                  class="w-full px-2.5 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        </template>

        <!-- 输入校验 -->
        <p v-if="inputError" class="text-xs leading-relaxed text-red-500 p-2 rounded bg-red-500/10 flex items-start gap-1.5">
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ inputError }}</span>
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

      <!-- 右侧：结果 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 报销测算明细
          </h2>
          <button
            v-if="canCalc"
            @click="copyResult"
            class="text-xs px-2.5 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-foreground transition"
          >
            <Copy class="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> 复制明细
          </button>
        </div>

        <template v-if="canCalc">
          <!-- 行程摘要卡 -->
          <div class="bg-primary/10 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-xs text-muted-foreground mb-1">行程口径</p>
              <p class="text-lg font-bold text-foreground">
                {{ departDate }} 至 {{ returnDate }} · {{ tripDays }} 天 {{ nightsNum }} 晚
              </p>
              <p class="text-xs text-muted-foreground mt-1">
                伙食 / 交通按 {{ allowanceDays }} 天计发（{{ firstLast75 ? '首末日各 0.75 折算' : '整天计发' }}）；住宿按 {{ nightsNum }} 晚计
              </p>
            </div>
            <div class="text-right">
              <p class="text-xs text-muted-foreground mb-1">合计</p>
              <p class="text-3xl font-bold text-primary font-mono">¥{{ fmtMoney(totals.total) }}</p>
            </div>
          </div>

          <!-- 分项明细 -->
          <div>
            <h3 class="text-sm font-semibold text-foreground mb-2">分项明细</h3>
            <div class="overflow-x-auto rounded-lg border border-border bg-background">
              <table class="w-full text-xs">
                <thead>
                  <tr class="text-muted-foreground border-b border-border bg-muted/40">
                    <th class="px-3 py-1.5 text-left font-medium">项目</th>
                    <th class="px-3 py-1.5 text-left font-medium">标准</th>
                    <th class="px-3 py-1.5 text-left font-medium">数量</th>
                    <th class="px-3 py-1.5 text-right font-medium">金额</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="border-b border-border/40 last:border-0">
                    <td class="px-3 py-1.5 text-foreground font-medium">伙食补助费</td>
                    <td class="px-3 py-1.5 text-muted-foreground">{{ fmtMoney(totals.mealStdUsed) }} 元 / 天</td>
                    <td class="px-3 py-1.5 text-muted-foreground">{{ allowanceDays }} 天</td>
                    <td class="px-3 py-1.5 text-right font-mono text-foreground">¥{{ fmtMoney(totals.meal) }}</td>
                  </tr>
                  <tr class="border-b border-border/40 last:border-0">
                    <td class="px-3 py-1.5 text-foreground font-medium">市内交通费</td>
                    <td class="px-3 py-1.5 text-muted-foreground">{{ fmtMoney(totals.transStdUsed) }} 元 / 天</td>
                    <td class="px-3 py-1.5 text-muted-foreground">{{ allowanceDays }} 天</td>
                    <td class="px-3 py-1.5 text-right font-mono text-foreground">¥{{ fmtMoney(totals.transport) }}</td>
                  </tr>
                  <tr class="border-b border-border/40 last:border-0">
                    <td class="px-3 py-1.5 text-foreground font-medium">住宿费</td>
                    <td class="px-3 py-1.5 text-muted-foreground">{{ fmtMoney(totals.hotelStdUsed) }} 元 / 晚{{ mode === 'gov' ? '（限额）' : '' }}</td>
                    <td class="px-3 py-1.5 text-muted-foreground">{{ nightsNum }} 晚</td>
                    <td class="px-3 py-1.5 text-right font-mono text-foreground">¥{{ fmtMoney(totals.hotel) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-if="mode === 'gov'" class="text-[11px] text-muted-foreground leading-relaxed mt-2">
              城市间交通费（高铁 / 机票等）按交通工具等级凭据据实报销，本表不含；住宿限额内凭发票据实报销、超限自付。
            </p>
          </div>

          <!-- 企业模式超支提示 -->
          <div v-if="mode === 'corp' && overs.length" class="text-xs leading-relaxed p-3 rounded-lg bg-red-500/10 text-red-600 border border-red-500/20 flex items-start gap-1.5">
            <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              超支提示：{{ overs.map((o) => o.label + '实报 ' + fmtMoney(o.actual) + ' 元，超标准 ' + fmtMoney(o.over) + ' 元').join('；') }}。
              按「实报超标准时按标准计」的包干口径，超出部分由个人承担；如单位按票据据实报销则另以制度为准。
            </span>
          </div>
          <p v-else-if="mode === 'corp'" class="text-xs leading-relaxed p-3 rounded-lg bg-green-500/10 text-green-600 border border-green-500/20 flex items-start gap-1.5">
            <CheckCircle class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>各分项均未超标准：可报销合计 {{ fmtMoney(totals.total) }} 元，与实报一致或按标准计。</span>
          </p>

          <!-- 报销单联动提示 -->
          <div class="border border-border rounded-lg p-4 bg-muted/30 flex items-start gap-2">
            <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p class="text-xs text-muted-foreground leading-relaxed">
              报销单请按单位财务模板填写（报销事由、行程、票据张数与金额需一一对应）；住宿发票尽量取得增值税专用发票并核对抬头税号，
              开票信息可用 <NuxtLink to="/tools/invoice-info-card/" class="text-primary hover:underline">开票信息卡生成器</NuxtLink> 存成卡片随用随取；
              报价 / 预算口径的对内确认单可用 <NuxtLink to="/tools/quotation-generator/" class="text-primary hover:underline">报价单生成器</NuxtLink>。
            </p>
          </div>
        </template>

        <!-- 空状态 -->
        <div v-else class="text-center text-muted-foreground py-16">
          <TriangleAlert class="w-10 h-10 mx-auto mb-3 text-yellow-500" />
          <p class="text-sm">请先完善左侧输入：{{ inputError }}。</p>
          <p class="text-xs text-muted-foreground/70 mt-1">也可以点击「载入示例」：周一出发周三返回（3 天 2 晚）北京档差旅测算。</p>
        </div>
      </div>
    </div>

    <!-- 口径与免责声明（页面固定） -->
    <div class="border border-border bg-muted/30 rounded-lg p-4 mb-8 flex items-start gap-2">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        口径依据：《中央和国家机关差旅费管理办法》（财行〔2013〕531 号）及财政部有关问题解答（财行〔2015〕497 号）、
        《财政部关于调整中央和国家机关差旅住宿费标准等有关问题的通知》（2016-01-01 起执行的分城市住宿限额）——伙食补助 100 元 / 人·天、市内交通费 80 元 / 人·天，
        住宿按城市分档限额、限额内凭票据实报销。本页档位表与标准均为示例常列值，
        <b class="text-foreground">以现行文件、地方规定与各单位差旅费管理制度为准</b>；本工具仅供测算参考。
      </p>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="bg-card border border-border rounded-lg mb-12 group">
      <summary class="flex items-center justify-between cursor-pointer select-none px-6 py-4">
        <span class="text-lg font-semibold text-foreground"><span class="text-primary mr-2">#</span>机关与企业差旅制度差异、示例档位表与常见问题</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform" />
      </summary>
      <div class="px-6 pb-6 space-y-6">
        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">计算公式</h3>
          <div class="bg-muted/50 rounded-xl p-4 text-sm text-foreground leading-relaxed space-y-2">
            <p><strong>出差天数</strong> = 返回日期 − 出发日期 + 1（首尾两天都算）；<strong>住宿晚数</strong>默认 = 天数 − 1，可按实际行程修改。</p>
            <p><strong>伙食 / 交通折算天</strong>：整天计发 = 天数；首末日折算 = 天数 − 2 × 0.25（单日往返按 0.75 天）。机关现行口径为按自然天数整计发，折算开关默认关闭与否请以本单位制度为准。</p>
            <p><strong>伙食补助费</strong> = 100 元 / 人·天 × 折算天；<strong>市内交通费</strong> = 80 元 / 人·天 × 折算天（由接待单位提供交通工具的不得领取）。</p>
            <p><strong>住宿费</strong> = 城市档限额 × 晚数（限额内凭票据实报销、超限自付）。</p>
            <p><strong>企业模式</strong>：可报销 = min（实报金额，日标准 × 天数或晚数）；实报超标准按标准计，差额个人承担（包干口径）。</p>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">机关事业单位 vs 企业：差旅制度差在哪？</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            机关事业单位执行财政部统一办法：四项构成（城市间交通费 / 住宿费 / 伙食补助费 / 市内交通费），
            伙食与市内交通<b class="text-foreground">定额包干</b>（中央机关常列 100 + 80 元 / 人·天），住宿按<b class="text-foreground">城市分档限额</b>内凭票据实报销、超限自付，
            人员档次（部级 / 司局级 / 处级及以下）影响住宿限额与交通工具等级。企业则自主制定：常见为「标准包干」（本页自定义日标准 × 天数，
            超支自付）或「凭票实报 + 上限」两种，标准高低由董事会 / 财务制度决定，法律只要求报销制度依法经民主程序制定并公示。
            两套体系不可混用：以出差单位的性质与制度为准。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">住宿费限额示例档位表（中央机关口径示例）</h3>
          <div class="overflow-x-auto rounded-lg border border-border bg-background">
            <table class="w-full text-xs">
              <thead>
                <tr class="text-muted-foreground border-b border-border bg-muted/40">
                  <th class="px-3 py-1.5 text-left font-medium">城市档（示例）</th>
                  <th class="px-3 py-1.5 text-right font-medium">部级</th>
                  <th class="px-3 py-1.5 text-right font-medium">司局级</th>
                  <th class="px-3 py-1.5 text-right font-medium">处级及以下</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-border/40 last:border-0">
                  <td class="px-3 py-1.5 text-foreground font-medium">一线城市示例（北京 / 上海等 11 城调整后）</td>
                  <td class="px-3 py-1.5 text-right font-mono text-foreground">1100</td>
                  <td class="px-3 py-1.5 text-right font-mono text-foreground">650</td>
                  <td class="px-3 py-1.5 text-right font-mono text-foreground">500</td>
                </tr>
                <tr class="border-b border-border/40 last:border-0">
                  <td class="px-3 py-1.5 text-foreground font-medium">一般地区示例（多数省份省会等）</td>
                  <td class="px-3 py-1.5 text-right font-mono text-foreground">800</td>
                  <td class="px-3 py-1.5 text-right font-mono text-foreground">480</td>
                  <td class="px-3 py-1.5 text-right font-mono text-foreground">350</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-[11px] text-muted-foreground leading-relaxed mt-2">
            数值为财政部 2016 年起执行的中央和国家机关分城市住宿限额常列示例（拉萨、西宁、哈尔滨、海口等另有旺季上浮）；地方机关、高校、国企参照制定各自标准，<b class="text-foreground">以现行文件与各单位规定为准</b>。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">发票合规提醒</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            住宿费尽量取得<b class="text-foreground">增值税专用发票</b>并核对发票抬头与单位全称、税号一致（一般纳税人可抵扣进项）；
            餐饮费通常为普通发票（餐饮进项不得抵扣）；交通票据注意行程单 / 打车票抬头要求。所有票据的日期应落在出差区间内、
            金额与行程能相互印证——票据与报销单信息不一致是退单最常见的原因。开票抬头与税号信息可提前存入
            <NuxtLink to="/tools/invoice-info-card/" class="text-primary hover:underline">开票信息卡生成器</NuxtLink>。
          </p>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">北京出差 3 天 2 晚（周一到周三）能报多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">按首末日各 0.75 折算：伙食 = 100 ×（1 + 0.75 × 2）= 250 元；市内交通 = 80 × 2.5 = 200 元；住宿按处级及以下 500 元 / 晚限额 × 2 晚 = 1000 元；合计约 1450 元（不含城市间交通费）。按财政部整天计发口径则伙食 300、交通 240。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">出发和返回当天伙食补助怎么算？</h3>
            <p class="text-sm text-muted-foreground mt-1">财政部现行口径：伙食补助按出差自然（日历）天数计算、整天数包干，出发 / 返回当天各算 1 天；「首末日各按 75% 折算」是外企 / GSA per diem 的通行做法，仅适用于执行该制度的单位，请以本单位制度为准（本页开关可切换）。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">住宿超标怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">机关口径：住宿费在限额标准之内凭发票据实报销，超限部分原则上个人自付（因会议 / 培训统一安排住宿等特殊情形按制度处理）。企业按包干或实报上限口径，本页企业模式会自动按标准截断并标出个人承担差额。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">伙食补助可以不吃饭就领吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">伙食补助费按出差天数定额包干、凭审批计发，与是否实际用餐无关；但由接待单位或会议 / 培训统一安排用餐期间不得重复领取（部分单位要求填《伙食补助费申领表》并如实申报），以现行文件与单位规定为准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">市内交通费 80 元包含打车吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">市内交通费按 80 元 / 人·天定额包干，打公交、地铁还是打车由个人自行安排、超支不补；但由接待单位或其他单位提供交通工具期间不得领取。城市间交通费（往返高铁 / 机票）另行按等级凭据报销，不计在这 80 元内。</p>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">口径来源与自查提示</h3>
          <ul class="text-xs text-muted-foreground leading-relaxed list-disc pl-5 space-y-1">
            <li>《中央和国家机关差旅费管理办法》（财行〔2013〕531 号，财政部官网原文）与《中央和国家机关差旅费管理办法有关问题的解答》（财行〔2015〕497 号）：伙食补助 100 元 / 人·天、市内交通费 80 元 / 人·天、按自然天数包干（两源核对）。</li>
            <li>《财政部关于调整中央和国家机关差旅住宿费标准等有关问题的通知》（2016-01-01 执行）：北京等一线档部级 1100 / 司局级 650 / 处级及以下 500；一般地区常列 800 / 480 / 350（财政部通知与《中央和国家机关国内差旅住宿费标准调整表》两源核对）。</li>
            <li>首末日 75% 折算为外企 / GSA per diem 通行做法，非中国机关现行法定口径；是否适用、住宿晚数如何认定（含午间离店）<b class="text-foreground">均以现行文件与本单位制度为准</b>。</li>
          </ul>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'travel-expense-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  Plane, Calculator, Info, TriangleAlert, CheckCircle,
  ChevronDown, RefreshCw, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '差旅费计算器 - 出差伙食补助/市内交通/住宿限额报销金额在线测算',
  description: '免费在线差旅费计算器：机关事业单位模式按财政部口径（伙食 100 元/天、市内交通 80 元/天、住宿城市档限额）与企业自定义日标准双模式测算报销明细，首末日 75% 折算可关，超支差额个人承担红标提示，纯浏览器本地计算不上传',
  keywords: '差旅费计算器,出差补贴标准,伙食补助100,市内交通费80,住宿限额,差旅报销明细,首末日折算',
  author: '有条工具',
  ogTitle: '差旅费计算器 - 出差伙食补助/市内交通/住宿限额报销金额在线测算 | 有条工具',
  ogDescription: '机关标准与企业自定义双模式，天数晚数自动折算，超支差额红标提示，分项明细一键复制。',
  ogUrl: 'https://www.util.cn/tools/travel-expense-calculator',
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
          name: '差旅费计算器',
          url: 'https://www.util.cn/tools/travel-expense-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['机关事业单位模式（伙食 100 / 交通 80 / 住宿城市档）', '企业自定义日标准与实报上限', '出发返回日期自动算天数晚数', '首末日 75% 折算开关（可关）', '超支差额个人承担红标提示', '分项明细与合计一键复制', '纯本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '差旅费计算器', item: 'https://www.util.cn/tools/travel-expense-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '北京出差 3 天 2 晚（周一到周三）能报多少？',
              acceptedAnswer: { '@type': 'Answer', text: '按首末日各 0.75 折算：伙食 100×2.5=250 元、市内交通 80×2.5=200 元、住宿 500 元/晚限额×2=1000 元，合计约 1450 元（不含城市间交通费）；按财政部整天计发口径伙食 300、交通 240。' }
            },
            {
              '@type': 'Question',
              name: '出发和返回当天伙食补助怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: '财政部现行口径按出差自然天数整计包干、首末日各算 1 天；首末日各按 75% 折算源自外企 / GSA per diem 做法，仅适用于执行该制度的单位，以本单位制度为准。' }
            },
            {
              '@type': 'Question',
              name: '住宿超标怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '机关口径限额内凭票据实报销、超限原则上个人自付；企业按包干或实报上限口径，实报超标准按标准计、差额个人承担。' }
            },
            {
              '@type': 'Question',
              name: '伙食补助可以不吃饭就领吗？',
              acceptedAnswer: { '@type': 'Answer', text: '伙食补助按出差天数定额包干、与是否实际用餐无关；但接待单位或会议培训统一安排用餐期间不得重复领取。' }
            },
            {
              '@type': 'Question',
              name: '市内交通费 80 元包含打车吗？',
              acceptedAnswer: { '@type': 'Answer', text: '市内交通费按 80 元/人·天定额包干，交通方式自选、超支不补；由接待单位提供交通工具期间不得领取。城市间交通费另行按等级凭据报销。' }
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
// - 《中央和国家机关差旅费管理办法》（财行〔2013〕531 号）及财政部解答（财行〔2015〕497 号）：
//   伙食补助费 100 元 / 人·天、市内交通费 80 元 / 人·天，按出差自然（日历）天数包干计发；
//   「首末日各 0.75 天折算」为外企 / GSA per diem 通行做法，作为可关闭开关（教学口径，非机关法定口径）。
// - 住宿费限额（财政部 2016-01-01 执行的分城市标准，示例常列值）：一线（北京/上海等）部级 1100 / 司局级 650 / 处级及以下 500；
//   一般地区 800 / 480 / 350。
// - 天数 = 返回 − 出发 + 1；住宿晚数默认 = 天数 − 1（参数化，可改）。
// 金额一律 0.01 元定点（round2）。

function round2(x) {
  return Math.round((Number(x) || 0) * 100) / 100
}

function max0(x) {
  const n = Number(x)
  return isFinite(n) && n > 0 ? n : 0
}

// 严格解析 YYYY-MM-DD → 各分量（避免时区问题，不用 new Date(string)；回读校验拒绝 2 月 30 日等非法日期）
function parseYmd(s) {
  if (typeof s !== 'string') return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  const dt = new Date(Date.UTC(y, mo - 1, d))
  if (dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null
  return { y, mo, d }
}

// 出差天数 = 返回 − 出发 + 1；任一日期非法或返回早于出发 → null
function tripDaysOf(depart, ret) {
  const a = parseYmd(depart)
  const b = parseYmd(ret)
  if (!a || !b) return null
  const diff = (Date.UTC(b.y, b.mo - 1, b.d) - Date.UTC(a.y, a.mo - 1, a.d)) / 86400000
  if (diff < 0) return null
  return Math.round(diff) + 1
}

// 伙食 / 交通折算天：整天计发 = 天数；75% 折算 = 天数 − 0.5（单日往返首末日重叠，按 0.75）
function allowanceDaysOf(days, firstLast75) {
  const d = max0(days)
  if (d <= 0) return 0
  if (!firstLast75) return d
  return d <= 1 ? 0.75 : round2(d - 0.5)
}

// 住宿费限额示例档位（元 / 晚）：城市档 × 人员档次
const HOTEL_LIMITS = {
  tier1: { chushi: 500, siju: 650, buzhang: 1100 },
  general: { chushi: 350, siju: 480, buzhang: 800 }
}

function hotelLimitOf(cityTier, rankTier) {
  const city = HOTEL_LIMITS[cityTier] ? cityTier : 'general'
  const rank = HOTEL_LIMITS[city][rankTier] !== undefined ? rankTier : 'chushi'
  return HOTEL_LIMITS[city][rank]
}

// 机关模式分项：伙食 = 伙食标准 × 折算天；交通 = 交通标准 × 折算天；住宿 = 限额 × 晚数
function govTotalsOf(mealStd, transStd, hotelLimit, allowanceDays, nights) {
  const meal = round2(max0(mealStd) * allowanceDays)
  const transport = round2(max0(transStd) * allowanceDays)
  const hotel = round2(max0(hotelLimit) * max0(nights))
  return { meal, transport, hotel, total: round2(meal + transport + hotel) }
}

// 企业模式单项：实报（null = 未填）与上限比较 → { payable, over }；未填实报按上限计
function corpItemOf(actual, cap) {
  const c = round2(max0(cap))
  if (actual === null || actual === '' || !isFinite(Number(actual))) {
    return { payable: c, over: 0, actualUsed: c }
  }
  const a = Math.max(0, Number(actual))
  const payable = round2(Math.min(a, c))
  return { payable, over: round2(Math.max(0, a - c)), actualUsed: a }
}

// 金额展示：千分位 + 固定 2 位小数
function fmtMoney(n) {
  const v = round2(n)
  const sign = v < 0 ? '-' : ''
  const parts = Math.abs(v).toFixed(2).split('.')
  return sign + parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + parts[1]
}
// ==PURE-END==

// ---------- 页面状态 ----------
const mode = ref('gov')
const departDate = ref('2026-11-02')
const returnDate = ref('2026-11-04')
const firstLast75 = ref(true)
const hotelNights = ref(2)

const govMealStd = ref(100)
const govTransStd = ref(80)
const cityTier = ref('tier1')
const rankTier = ref('chushi')
const hotelLimit = ref(500)

const corpMealStd = ref(0)
const corpTransStd = ref(0)
const corpHotelStd = ref(0)
const corpMealActual = ref('')
const corpTransActual = ref('')
const corpHotelActual = ref('')

// 选城市档 / 人员档次后自动填入示例限额（可手动改）
watch([cityTier, rankTier], ([c, r]) => {
  hotelLimit.value = hotelLimitOf(c, r)
})

// 日期变化后自动更新住宿晚数 = 天数 − 1（可手动改）
watch([departDate, returnDate], () => {
  const d = tripDaysOf(departDate.value, returnDate.value)
  if (d !== null) hotelNights.value = Math.max(0, d - 1)
})

onMounted(() => {
  addRecentTool('travel-expense-calculator')
  // SSR 后首次进入：日期为写死的示例，避免水合不一致，这里仅补当前月份行程（如为空）
  if (!departDate.value && !returnDate.value) {
    const now = new Date()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    departDate.value = `${now.getFullYear()}-${mm}-${dd}`
    returnDate.value = departDate.value
  }
})

// ---------- 派生 ----------
const tripDays = computed(() => tripDaysOf(departDate.value, returnDate.value))
const nightsNum = computed(() => max0(hotelNights.value))
const allowanceDays = computed(() => (tripDays.value === null ? 0 : allowanceDaysOf(tripDays.value, firstLast75.value)))

const daysText = computed(() => (tripDays.value === null ? '—' : `${tripDays.value} 天`))
const allowanceDaysText = computed(() => (tripDays.value === null ? '—' : `${allowanceDays.value} 天`))

const inputError = computed(() => {
  if (tripDays.value === null) return '请填写合法的出发 / 返回日期（返回不得早于出发）'
  if (mode.value === 'gov') {
    if (!(max0(govMealStd.value) >= 0) || !(max0(govTransStd.value) >= 0)) return '伙食 / 交通标准需为非负数字'
    if (!(max0(hotelLimit.value) > 0)) return '住宿限额需大于 0（可按当地实际档位填写）'
  } else {
    if (max0(corpMealStd.value) <= 0 && max0(corpTransStd.value) <= 0 && max0(corpHotelStd.value) <= 0) return '请至少填写一项企业自定义日标准'
  }
  return ''
})

const canCalc = computed(() => inputError.value === '')

// ---------- 核心测算 ----------
const govResult = computed(() => {
  const t = govTotalsOf(govMealStd.value, govTransStd.value, hotelLimit.value, allowanceDays.value, nightsNum.value)
  return { ...t, mealStdUsed: govMealStd.value, transStdUsed: govTransStd.value, hotelStdUsed: hotelLimit.value }
})

const corpResult = computed(() => {
  const mealCap = round2(max0(corpMealStd.value) * allowanceDays.value)
  const transCap = round2(max0(corpTransStd.value) * allowanceDays.value)
  const hotelCap = round2(max0(corpHotelStd.value) * nightsNum.value)
  const meal = corpItemOf(corpMealActual.value, mealCap)
  const transport = corpItemOf(corpTransActual.value, transCap)
  const hotel = corpItemOf(corpHotelActual.value, hotelCap)
  const total = round2(meal.payable + transport.payable + hotel.payable)
  const overs = []
  if (meal.over > 0) overs.push({ label: '伙食', actual: meal.actualUsed, over: meal.over })
  if (transport.over > 0) overs.push({ label: '交通', actual: transport.actualUsed, over: transport.over })
  if (hotel.over > 0) overs.push({ label: '住宿', actual: hotel.actualUsed, over: hotel.over })
  return {
    meal, transport, hotel, total, overs,
    mealStdUsed: corpMealStd.value, transStdUsed: corpTransStd.value, hotelStdUsed: corpHotelStd.value
  }
})

const totals = computed(() => (mode.value === 'gov' ? govResult.value : corpResult.value))
const overs = computed(() => (mode.value === 'corp' ? corpResult.value.overs : []))

// 复制结果（navigator.clipboard + alert）
function copyResult() {
  const t = totals.value
  const lines = [
    '【差旅费报销测算】',
    `行程：${departDate.value} 至 ${returnDate.value}，共 ${tripDays.value} 天 ${nightsNum.value} 晚`,
    `伙食补助：${fmtMoney(t.meal)} 元（${fmtMoney(t.mealStdUsed)} 元/天 × ${allowanceDays.value} 天${mode.value === 'gov' && firstLast75.value ? '，首末日各 0.75 折算' : ''}）`,
    `市内交通：${fmtMoney(t.transport)} 元（${fmtMoney(t.transStdUsed)} 元/天 × ${allowanceDays.value} 天）`,
    `住宿费：${fmtMoney(t.hotel)} 元（${fmtMoney(t.hotelStdUsed)} 元/晚 × ${nightsNum.value} 晚${mode.value === 'gov' ? '，限额内据实报销' : ''}）`,
    `合计：${fmtMoney(t.total)} 元（不含城市间交通费）`,
    overs.value.length ? `超支提示：${overs.value.map((o) => o.label + '超 ' + fmtMoney(o.over) + ' 元由个人承担').join('；')}` : '',
    '免责：示例口径测算，以现行文件与各单位差旅制度为准。'
  ].filter(Boolean).join('\n')
  navigator.clipboard.writeText(lines).then(() => alert('已复制')).catch(() => alert('复制失败，请手动复制'))
}

function loadExample() {
  mode.value = 'gov'
  departDate.value = '2026-11-02'
  returnDate.value = '2026-11-04'
  firstLast75.value = true
  hotelNights.value = 2
  govMealStd.value = 100
  govTransStd.value = 80
  cityTier.value = 'tier1'
  rankTier.value = 'chushi'
  hotelLimit.value = 500
  corpMealStd.value = 80
  corpTransStd.value = 50
  corpHotelStd.value = 400
  corpMealActual.value = ''
  corpTransActual.value = ''
  corpHotelActual.value = ''
}

function resetAll() {
  departDate.value = ''
  returnDate.value = ''
  firstLast75.value = true
  hotelNights.value = ''
  govMealStd.value = 100
  govTransStd.value = 80
  cityTier.value = 'tier1'
  rankTier.value = 'chushi'
  hotelLimit.value = 500
  corpMealStd.value = 0
  corpTransStd.value = 0
  corpHotelStd.value = 0
  corpMealActual.value = ''
  corpTransActual.value = ''
  corpHotelActual.value = ''
}
</script>
