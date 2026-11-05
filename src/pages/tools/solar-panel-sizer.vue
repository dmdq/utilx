<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Sun class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">太阳能离网配置计算器 - 板功率/电池容量/控制器选型</h1>
          <p class="text-sm text-muted-foreground mt-1">四步配置：负载清单 → 电池容量 → 光伏板功率 → 控制器电流，按最差月峰值日照口径</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        离网光伏系统配置工具：① 录入负载清单（设备功率 × 日使用小时）得日耗电量；② 按自给天数、放电深度 DoD
        与逆变器效率推算蓄电池容量（Ah@系统电压）；③ 按当地最差月峰值日照时数与系统效率 0.75 折算光伏板功率并吸附常见档位；
        ④ 按板功率 ÷ 系统电压 × 1.25 余量选控制器电流档，并给出 PWM / MPPT 选型注记。
        适用于房车、船屋、庭院照明、基站与无电地区供电等离网场景。全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/50 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        口径：峰值日照时数（Peak Sun Hours）按<strong class="text-foreground">当地最差月</strong>取值（年最差月平均日辐照量 kWh/m²/日），
        而非年均值——离网系统要保证最差月份不断电。系统效率 0.75 已含温度折损、灰尘遮挡、线损与 MPPT 转换损耗；
        电池口径 = 日耗 × 自给天数 ÷ DoD ÷ 逆变器效率；控制器口径 = 板功率 ÷ 系统电压 × 1.25 安全余量（对应 MPPT 输出电流口径）。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算区 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 步骤① 负载清单 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-foreground flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0">1</span>
              负载清单（设备功率 × 日使用小时）
            </h2>
            <button
              @click="addLoadRow"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-sm text-foreground transition"
            >
              <Plus class="w-4 h-4" /> 添加设备
            </button>
          </div>

          <div v-if="loadRows.length" class="space-y-2">
            <div
              v-for="(row, idx) in loadRows"
              :key="row.id"
              class="flex items-center gap-2"
            >
              <span class="text-xs text-muted-foreground w-6 flex-shrink-0">{{ idx + 1 }}.</span>
              <input
                v-model="row.name"
                type="text"
                class="w-32 sm:w-48 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="设备名（如照明）"
              >
              <input
                v-model.number="row.watts"
                type="number"
                step="1"
                min="0"
                class="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="功率 W"
              >
              <span class="text-xs text-muted-foreground flex-shrink-0">W ×</span>
              <input
                v-model.number="row.hours"
                type="number"
                step="0.5"
                min="0"
                max="24"
                class="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="小时/天"
              >
              <span class="text-xs text-muted-foreground flex-shrink-0">h</span>
              <span class="text-xs text-muted-foreground font-mono w-20 text-right flex-shrink-0">= {{ fmtWh(rowWh(row)) }}</span>
              <button
                @click="removeLoadRow(row.id)"
                class="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition flex-shrink-0"
                aria-label="删除该设备"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div v-else class="p-6 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
            点击「添加设备」录入负载清单，例如：照明 20W × 5h、冰箱 60W × 10h（按压缩机运行折算）
          </div>

          <div class="flex items-center justify-between p-3 bg-muted/50 border border-border rounded-lg">
            <span class="text-sm text-muted-foreground">日耗电量（交流负载按逆变器后口径）</span>
            <span class="font-mono text-xl font-bold text-green-600 dark:text-green-400">{{ fmtWh(dailyWh) }}</span>
          </div>
        </div>

        <!-- 步骤② 电池容量 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="font-semibold text-foreground flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0">2</span>
            蓄电池容量（日耗 × 自给天数 ÷ DoD ÷ 逆变器效率）
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label for="autonomy-in" class="block text-sm font-medium text-foreground mb-1.5">自给天数</label>
              <input
                id="autonomy-in"
                v-model.number="autonomyDays"
                type="number"
                step="1"
                min="1"
                max="10"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
              <p class="text-xs text-muted-foreground mt-1">连续阴雨天兜底，常用 2 天</p>
            </div>
            <div>
              <label for="dod-in" class="block text-sm font-medium text-foreground mb-1.5">电池类型（DoD）</label>
              <select
                id="dod-in"
                v-model.number="dod"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option :value="0.5">铅酸（DoD 50%）</option>
                <option :value="0.8">锂电（DoD 80%）</option>
              </select>
              <p class="text-xs text-muted-foreground mt-1">放电深度：放出容量的安全上限</p>
            </div>
            <div>
              <label for="inveff-in" class="block text-sm font-medium text-foreground mb-1.5">逆变器效率</label>
              <input
                id="inveff-in"
                v-model.number="invEff"
                type="number"
                step="0.01"
                min="0.5"
                max="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
              <p class="text-xs text-muted-foreground mt-1">典型 0.9（含待机损耗）</p>
            </div>
            <div>
              <label for="sysv-in" class="block text-sm font-medium text-foreground mb-1.5">系统电压</label>
              <select
                id="sysv-in"
                v-model.number="sysV"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option :value="12">12 V</option>
                <option :value="24">24 V</option>
                <option :value="48">48 V</option>
              </select>
              <p class="text-xs text-muted-foreground mt-1">日耗 &gt; 1 kWh 建议 24/48V 降压流</p>
            </div>
          </div>

          <template v-if="batteryResult">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="bg-green-500/5 border border-green-500/30 rounded-lg p-3">
                <div class="text-xs text-muted-foreground mb-1">电池组容量</div>
                <div class="font-mono text-2xl font-bold text-green-600 dark:text-green-400">{{ fmtNum(batteryResult.ah) }} <span class="text-base">Ah</span></div>
                <div class="text-xs text-muted-foreground mt-0.5">@ {{ sysV }} V 系统电压</div>
              </div>
              <div class="bg-muted/50 border border-border rounded-lg p-3">
                <div class="text-xs text-muted-foreground mb-1">标称储能</div>
                <div class="font-mono text-lg font-semibold text-foreground">{{ fmtWh(batteryResult.kwh) }}</div>
                <div class="text-xs text-muted-foreground mt-0.5">可用 {{ fmtWh(usableWh) }}（DoD × 逆变效率后）</div>
              </div>
              <div class="bg-muted/50 border border-border rounded-lg p-3">
                <div class="text-xs text-muted-foreground mb-1">组合参考</div>
                <div class="font-mono text-lg font-semibold text-foreground">{{ batteryResult.bank12v200 }} 组</div>
                <div class="text-xs text-muted-foreground mt-0.5">12V 200Ah 单体向上取整</div>
              </div>
            </div>
            <div class="bg-muted/50 border border-border rounded-lg p-3 text-xs leading-relaxed text-muted-foreground">
              回验：{{ fmtWh(dailyWh) }} × {{ fmtNum(autonomyNum) }} 天 ÷ ({{ fmtNum(dodNum) }} DoD × {{ fmtNum(invEffNum) }} 逆变效率) = 标称 {{ fmtWh(batteryResult.kwh) }}；
              换算容量 = {{ fmtWh(batteryResult.kwh) }} ÷ {{ sysV }} V = {{ fmtNum(batteryResult.ah) }} Ah。
            </div>
          </template>
          <div v-else class="p-6 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
            先在步骤①录入负载得到日耗电量
          </div>
        </div>

        <!-- 步骤③ 光伏板功率 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="font-semibold text-foreground flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0">3</span>
            光伏板功率（日耗 ÷ 峰值日照 ÷ 系统效率）
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">峰值日照时数（当地最差月）</label>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="h in SUN_HOURS"
                  :key="h"
                  @click="sunHours = h"
                  :class="sunHours === h ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="px-3 py-2 rounded-lg text-sm font-mono font-medium transition-all"
                >{{ h }} h</button>
              </div>
              <p class="text-xs text-muted-foreground mt-1">按最差月日均辐照量取值，查法见下方说明</p>
            </div>
            <div>
              <label for="syseff-in" class="block text-sm font-medium text-foreground mb-1.5">系统效率</label>
              <input
                id="syseff-in"
                v-model.number="sysEff"
                type="number"
                step="0.01"
                min="0.4"
                max="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
              <p class="text-xs text-muted-foreground mt-1">默认 0.75：温度/灰尘/线损/MPPT 折损合计</p>
            </div>
          </div>

          <template v-if="panelResult">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="bg-muted/50 border border-border rounded-lg p-3">
                <div class="text-xs text-muted-foreground mb-1">理论板功率</div>
                <div class="font-mono text-lg font-semibold text-foreground">{{ fmtNum(panelResult.exact) }} W</div>
                <div class="text-xs text-muted-foreground mt-0.5">{{ fmtWh(dailyWh) }} ÷ {{ fmtNum(sunHours) }} h ÷ {{ fmtNum(sysEffNum) }}</div>
              </div>
              <div class="bg-green-500/5 border border-green-500/30 rounded-lg p-3">
                <div class="text-xs text-muted-foreground mb-1">吸附常见档位</div>
                <div class="font-mono text-2xl font-bold text-green-600 dark:text-green-400">{{ fmtNum(panelResult.snap) }} <span class="text-base">W</span></div>
                <div class="text-xs text-muted-foreground mt-0.5">向上取档，不允许欠配</div>
              </div>
              <div class="bg-muted/50 border border-border rounded-lg p-3">
                <div class="text-xs text-muted-foreground mb-1">板阵组合参考</div>
                <div class="font-mono text-lg font-semibold text-foreground">{{ panelResult.combo }}</div>
                <div class="text-xs text-muted-foreground mt-0.5">常见组件规格拼配</div>
              </div>
            </div>
          </template>
          <div v-else class="p-6 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
            先在步骤①录入负载并选择峰值日照时数
          </div>
        </div>

        <!-- 步骤④ 控制器 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="font-semibold text-foreground flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0">4</span>
            充电控制器电流（板功率 ÷ 系统电压 × 1.25 余量）
          </h2>
          <template v-if="controllerResult">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="bg-muted/50 border border-border rounded-lg p-3">
                <div class="text-xs text-muted-foreground mb-1">理论充电电流</div>
                <div class="font-mono text-lg font-semibold text-foreground">{{ fmtNum(controllerResult.exact) }} A</div>
                <div class="text-xs text-muted-foreground mt-0.5">{{ fmtNum(panelWForCtl) }} W ÷ {{ sysV }} V × 1.25</div>
              </div>
              <div class="bg-green-500/5 border border-green-500/30 rounded-lg p-3">
                <div class="text-xs text-muted-foreground mb-1">吸附常见档位</div>
                <div class="font-mono text-2xl font-bold text-green-600 dark:text-green-400">{{ controllerResult.snap }} <span class="text-base">A</span></div>
                <div class="text-xs text-muted-foreground mt-0.5">10 / 20 / 30 / 60 / 100A 常见档</div>
              </div>
              <div class="bg-muted/50 border border-border rounded-lg p-3">
                <div class="text-xs text-muted-foreground mb-1">拓扑建议</div>
                <div class="text-lg font-semibold text-foreground">{{ controllerResult.mpptAdvice }}</div>
                <div class="text-xs text-muted-foreground mt-0.5">PWM / MPPT 选型注记</div>
              </div>
            </div>
            <div class="bg-muted/50 border border-border rounded-lg p-3 text-xs leading-relaxed text-muted-foreground">
              <p>
                <CheckCircle class="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-green-600 dark:text-green-400" />
                本口径 = MPPT 控制器的<strong class="text-foreground">输出（电池侧）电流</strong>：I = P<sub>板</sub>/V<sub>电池</sub> × 1.25。
                若选 PWM，需按组件短路电流 I<sub>sc</sub> 口径复核（I<sub>sc</sub> ≈ 板功率 ÷ 组件 V<sub>mp</sub>，12V 系统组件 V<sub>mp</sub> ≈ 18V），
                且 PWM 会把组件钳在电池电压工作，「12V 组件配 12V 电池」以外的组合会有明显功率损失，见下方说明。
              </p>
              <p class="mt-1.5">串联校验：MPPT 最大输入电压须 ≥ 组件串联开路电压 V<sub>oc</sub>（低温下 +10~15%），这一项比电流更容易烧控制器。</p>
            </div>
          </template>
          <div v-else class="p-6 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
            完成步骤③得到板功率后自动计算
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center">
            <Lightbulb class="w-4 h-4 mr-2 text-primary" /> 使用要点
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2 leading-relaxed list-disc pl-4">
            <li>冰箱、水泵等间歇负载按「实际运行时间 × 功率」折算，别按 24h 全开算；感性负载启动功率另校逆变器浪涌能力。</li>
            <li>铅酸 DoD 取 50%（深循环也建议不超过 60%），锂电可取 80%；DoD 越低电池寿命越长。</li>
            <li>日耗超过 1 kWh 优先上 24V/48V 系统：同功率下电流减半，线损与控制器成本显著下降。</li>
            <li>控制器电流按吸附后的板功率档位计算，余量 1.25 是常规口径；MPPT 还要看最大输入电压与电池充电电压档匹配。</li>
            <li>锂电池建议选带锂电活化程序的 MPPT 控制器，并核对充电曲线（吸收电压 / 均衡关闭）。</li>
          </ul>
        </div>

        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center">
            <CheckCircle class="w-4 h-4 mr-2 text-primary" /> 口径与自检锚点
          </h3>
          <ul class="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
            <li>• 日耗 1000Wh、峰值 4h、效率 0.75 → 板 333 W → 吸附 400 W</li>
            <li>• 电池：1000Wh × 2 天 ÷ (0.5 DoD × 0.9 逆变) ÷ 12V → 370.4 Ah</li>
            <li>• 锂电同口径（DoD 0.8）→ 231.5 Ah@12V</li>
            <li>• 控制器：400 W ÷ 12 V × 1.25 = 41.7 A → 吸附 60 A 档</li>
            <li>• 板功率吸附口径：向上取最近常见档（不允许欠配）</li>
          </ul>
        </div>

        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center">
            <LinkIcon class="w-4 h-4 mr-2 text-primary" /> 相关工具
          </h3>
          <div class="space-y-2">
            <NuxtLink
              v-for="t in relatedLinks"
              :key="t.id"
              :to="'/tools/' + t.id"
              class="block px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-sm text-foreground transition"
            >{{ t.name }}</NuxtLink>
          </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>为什么按「最差月」配置？</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          并网系统发电不足可以从电网补，离网系统断电就是断供——所以离网配置的基准是<strong class="text-foreground">全年最差的那个月</strong>，
          而不是年均值。冬季的三个不利因素叠加：① 日辐照量降到年均的 50~60%（纬度越高越明显）；
          ② 温度低使铅酸电池容量下降 10~20%；③ 部分负载（照明时长、取暖）反而在冬天更大。
          按年均值配的系统「夏天很好、冬天趴窝」是最常见的离网设计事故。本工具的峰值日照时数一栏请填最差月的
          日均峰值日照（≈ 当月日均辐照量 kWh/m²/日的数值），而非年均日照。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>峰值日照时数在哪里查？</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          峰值日照时数（Peak Sun Hours, PSH）= 当地日均太阳辐照量（kWh/m²/日）的数值本身：
          4.0 PSH 意思是每天相当于 4 小时标准的 1000 W/m² 标准测试条件辐照。常用查询来源：
          ① <strong class="text-foreground">Global Solar Atlas</strong>（世界银行/Solargis，免费，可直接读逐月 GHI）；
          ② <strong class="text-foreground">NASA POWER</strong>（免费 API，逐月多年平均辐照）；
          ③ <strong class="text-foreground">Meteonorm / PVsyst 气象库</strong>（商用精度高）；④ 当地气象局太阳辐射资料。
          查到逐月 GHI 后取<strong class="text-foreground">最差月</strong>的数值。粗略经验值：中国西北/高原 4.5~5.5，华北 3.5~4.5，
          长江中下游 2.5~3.5（梅雨季最差），四川盆地 2~2.5，高纬度欧洲 1~3。倾斜安装按阵列面辐照（POA）取值会比水平 GHI 更有利。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>PWM vs MPPT：差 20~30% 的原因</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          组件的功率-电压曲线上有一个最大功率点（V<sub>mp</sub> ≈ 0.8×V<sub>oc</sub>），
          「12V 系统」组件的 V<sub>mp</sub> 实际约 17~19V。<strong class="text-foreground">PWM</strong> 控制器本质是一只开关：
          它把组件直接钳在电池电压（12.0~14.4V 随充电状态变化）上，组件被迫离开最大功率点工作，
          多出来的电压余量（约 4~6V）全部白白损失，折损典型 20~30%（冬天低温时 V<sub>mp</sub> 升高、损失更大）。
          <strong class="text-foreground">MPPT</strong> 控制器内置 DC-DC 变换，实时跟踪最大功率点，
          把「高压小电流」变换成「电池需要的低压大电流」，把这部分余量收回来（转换效率 96~98%）。
          所以同样板功率，MPPT 的实际充电量约多 20~30%，且允许组件串联升压、用细一点的线缆。
          PWM 的适用面：小系统（&lt;200W）、组件与电池电压严格匹配（如「12V 组件充 12V 电池」）、预算敏感；
          MPPT 适用面：200W 以上、板距电池较远、组件串并联组合复杂、冬季占比高的地区。
          控制器电流口径也随之不同：MPPT 按「板功率 ÷ 电池电压」的输出电流选型；PWM 按组件 I<sub>sc</sub> 选型。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>板子串联并联与控制器电压</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          组件串并联决定板阵的 V<sub>mp</sub> 与 I<sub>mp</sub>：<strong class="text-foreground">串联升压降流</strong>（同功率下线损按 I²R 下降，
          长距离布线划算），<strong class="text-foreground">并联升流稳压</strong>（受遮挡影响小，但电流大、线径粗）。
          与控制器的匹配要盯三个电压：① <strong class="text-foreground">最大输入电压</strong>：串联开路电压 V<sub>oc</sub>(串) 必须 &lt; 控制器最大 PV 输入电压，
          且要按<strong class="text-foreground">当地极端低温</strong>修正——V<sub>oc</sub> 随温度降低而升高（约 +0.3%/℃），−10℃ 时比 STC 高 10~15%，
          「冬天早上第一缕阳光烧控制器」是最常见的串配事故；② <strong class="text-foreground">启动/工作电压</strong>：MPPT 需要 V<sub>mp</sub> 高于电池电压 +1~2V 才能启动升压以外的变换，
          12V 电池系统建议组件串 V<sub>mp</sub> ≥ 18V（常用 2 片 12V 组件串联 = 36V）；③ <strong class="text-foreground">充电电压档</strong>：
          控制器的吸收/浮充电压参数要匹配电池 chemistry 与串数（铅酸 14.4/13.8V，锂电 14.2~14.6V 视 BMS）。
          并联支路建议各串加熔断/防反二极管（或用带防反的汇流盒）。电池容量与续航的进一步估算可参考
          <NuxtLink to="/tools/battery-runtime" class="text-primary hover:underline">电池续航估算</NuxtLink> 与
          <NuxtLink to="/tools/ups-runtime" class="text-primary hover:underline">UPS 续航估算</NuxtLink>。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">1000Wh 日耗需要多大光伏板和电池？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              按最差月峰值日照 4h、系统效率 0.75：板功率 = 1000 ÷ 4 ÷ 0.75 ≈ 333W，向上吸附常见档 400W。
              电池按 2 天自给、铅酸（DoD 0.5）、逆变效率 0.9：1000 × 2 ÷ 0.45 = 4.44 kWh 标称，
              12V 系统即 4444 ÷ 12 ≈ 370Ah（≈2 组 12V 200Ah）；换锂电（DoD 0.8）约 231Ah。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">12V 还是 24V / 48V 系统怎么选？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              看日耗与距离：日耗 &lt; 500Wh 且线短可用 12V；1~3 kWh 建议 24V；3 kWh 以上或逆变器 ≥3kW 建议 48V。
              同功率下电压翻倍电流减半，线损按 I²R 降到 1/4，控制器/熔断器/线缆规格全面降档，大系统省下的钱远超升压成本。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">控制器为什么要留 1.25 倍余量？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              一是低温高辐照工况下组件输出可能短时超过标称（STC 是 25℃ 标准条件，冷晴天气可超 10%+）；
              二是控制器持续满载发热大、寿命缩短，留 25% 余量让它工作在 80% 负载以内；
              三是给后期扩板留一格余量。所以 400W/12V 系统算出 41.7A，选 60A 档而不是 40A。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">铅酸和锂电的 DoD 为什么不一样？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              铅酸深放电会硫酸盐化、极板软化，每次放到 80% DoD 寿命只剩几百次循环，标称口径按 50% 是寿命与容量的折中；
              磷酸铁锂可以放到 80~90% DoD 仍有 3000+ 次循环，按 80% 取值已很保守。同样「标称容量」下，
              锂电的可用容量约为铅酸的 1.6 倍，这也是锂电单价高但度电成本接近的原因。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :current-tool-id="'solar-panel-sizer'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Sun, Info, Lightbulb, CheckCircle, Link as LinkIcon,
  ChevronUp, ChevronDown, Plus, Trash2
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'solar-panel-sizer'
const STORAGE_KEY = 'solar-panel-sizer.inputs'

// SEO
useSeoMeta({
  title: '太阳能离网配置计算器 - 光伏板功率/电池容量/控制器选型',
  description: '在线太阳能离网系统配置工具：负载清单算日耗电量，按自给天数与 DoD 推算电池容量 Ah，按最差月峰值日照与系统效率 0.75 折算光伏板功率并吸附常见档位，控制器按板功率÷系统电压×1.25 选型，含 PWM/MPPT 注记，纯本地计算',
  keywords: '太阳能配置计算, 离网光伏配置, 光伏板功率计算, 电池容量计算 ah, 控制器选型, pwm mppt 区别, 峰值日照时数, solar panel calculator, off grid solar',
  author: 'Util工具箱',
  ogTitle: '太阳能离网配置计算器 - 有条工具',
  ogDescription: '负载→电池→光伏板→控制器四步配置，按最差月峰值日照口径',
  ogUrl: 'https://www.util.cn/tools/solar-panel-sizer',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '太阳能离网配置计算器',
  twitterDescription: '离网光伏四步配置：日耗电量、电池容量、板功率、控制器选型'
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
          name: '太阳能离网配置计算器',
          url: 'https://www.util.cn/tools/solar-panel-sizer',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '负载清单动态行统计日耗电量（Wh）',
            '电池容量 = 日耗 × 自给天数 ÷ DoD ÷ 逆变器效率（Ah@12/24/48V）',
            '板功率 = 日耗 ÷ 峰值日照 ÷ 0.75，向上吸附常见档位',
            '控制器电流 = 板功率 ÷ 系统电压 × 1.25，吸附常见档',
            'PWM / MPPT 选型注记与串联 Voc 校验提示'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '太阳能离网配置计算器', item: 'https://www.util.cn/tools/solar-panel-sizer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '1000Wh 日耗需要多大光伏板和电池？',
              acceptedAnswer: { '@type': 'Answer', text: '按最差月峰值日照 4h、系统效率 0.75：板功率 = 1000 ÷ 4 ÷ 0.75 ≈ 333W，吸附常见档 400W；电池按 2 天自给、铅酸 DoD 0.5、逆变效率 0.9：1000×2÷0.45 = 4.44 kWh 标称，12V 系统 ≈ 370Ah；锂电（DoD 0.8）约 231Ah。' }
            },
            {
              '@type': 'Question',
              name: '12V 还是 24V / 48V 系统怎么选？',
              acceptedAnswer: { '@type': 'Answer', text: '按日耗与布线距离：<500Wh 且线短可用 12V；1~3 kWh 建议 24V；3 kWh 以上或逆变器 ≥3kW 建议 48V。电压翻倍电流减半，线损按 I²R 降至 1/4，控制器与线缆规格全面降档。' }
            },
            {
              '@type': 'Question',
              name: '控制器为什么要留 1.25 倍余量？',
              acceptedAnswer: { '@type': 'Answer', text: '冷晴天气组件输出可短时超 STC 标称 10% 以上；满载长期发热缩短控制器寿命；并给后期扩板留余量。400W/12V 算出 41.7A 应选 60A 档而非 40A。' }
            },
            {
              '@type': 'Question',
              name: '铅酸和锂电的 DoD 为什么不一样？',
              acceptedAnswer: { '@type': 'Answer', text: '铅酸深放电会硫酸盐化，80% DoD 仅数百次循环，按 50% 取值是寿命折中；磷酸铁锂 80% DoD 仍有 3000+ 次循环。同标称容量下锂电可用容量约为铅酸的 1.6 倍。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === TOOL_ID)
onMounted(() => {
  addRecentTool(TOOL_ID)
  // 恢复上次输入
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const s = JSON.parse(raw)
      if (Array.isArray(s.loadRows)) {
        const rows = s.loadRows
          .filter(r => r && typeof r.name === 'string' && isFinite(Number(r.watts)) && isFinite(Number(r.hours)))
          .map(r => ({ id: nextRowId(), name: String(r.name), watts: Number(r.watts), hours: Number(r.hours) }))
        loadRows.value = rows.slice(0, 40)
      }
      if (typeof s.autonomyDays === 'number' && s.autonomyDays >= 1) autonomyDays.value = s.autonomyDays
      if (s.dod === 0.5 || s.dod === 0.8) dod.value = s.dod
      if (typeof s.invEff === 'number' && s.invEff > 0) invEff.value = s.invEff
      if (s.sysV === 12 || s.sysV === 24 || s.sysV === 48) sysV.value = s.sysV
      if (SUN_HOURS.includes(s.sunHours)) sunHours.value = s.sunHours
      if (typeof s.sysEff === 'number' && s.sysEff > 0) sysEff.value = s.sysEff
    }
  } catch (e) { /* localStorage 不可用时忽略 */ }
})

// __PURE_FNS_START__
// ---------- 负载清单 ----------
// 单行日耗：功率 W × 小时/天（非法输入按 0 计）
const rowWh = (row) => {
  const w = Number(row && row.watts)
  const h = Number(row && row.hours)
  if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) return 0
  return w * h
}
// 日耗总量（Wh）
const sumDailyWh = (rows) => rows.reduce((s, r) => s + rowWh(r), 0)

// ---------- ② 电池容量 ----------
// 标称储能 Wh = 日耗 × 自给天数 ÷ DoD ÷ 逆变器效率；Ah = 标称 Wh ÷ 系统电压
const batteryCapacity = (dailyWh, days, dod, invEff, sysV) => {
  if (!(dailyWh > 0) || !(days > 0) || !(dod > 0) || !(invEff > 0) || !(sysV > 0)) return null
  const kwh = dailyWh * days / (dod * invEff)
  const ah = kwh / sysV
  return { kwh, ah, bank12v200: Math.ceil(ah / 200) }
}

// ---------- ③ 光伏板功率 ----------
// 理论板功率 = 日耗 ÷ 峰值日照时数 ÷ 系统效率（峰值日照按当地最差月取值）
const panelExactW = (dailyWh, sunHours, sysEff) => {
  if (!(dailyWh > 0) || !(sunHours > 0) || !(sysEff > 0)) return null
  return dailyWh / (sunHours * sysEff)
}
// 常见板功率档位：向上取最近档（不允许欠配），超出上限按 100W 步进向上取整
const PANEL_LADDER = [50, 100, 150, 200, 250, 300, 400, 500, 600]
const snapPanel = (w) => {
  if (!(w > 0)) return null
  const hit = PANEL_LADDER.find(x => x >= w)
  if (hit) return hit
  return Math.ceil(w / 100) * 100
}
// 板阵组合参考：用常见规格拼配吸附档位
const panelCombo = (snap) => {
  if (!(snap > 0)) return '—'
  if (snap % 400 === 0) return `${snap / 400} × 400W`
  if (snap % 200 === 0) return `${snap / 200} × 200W`
  if (snap % 100 === 0) return `${snap / 100} × 100W`
  if (snap % 50 === 0) return `${snap / 50} × 50W`
  return `${snap} W 定制`
}

// ---------- ④ 控制器 ----------
// 理论充电电流 = 板功率 ÷ 系统电压 × 1.25 安全余量（MPPT 输出电流口径）
const controllerExactA = (panelW, sysV) => {
  if (!(panelW > 0) || !(sysV > 0)) return null
  return panelW / sysV * 1.25
}
// 常见电流档位：向上取最近档，超出上限按 20A 步进向上取整
const CTRL_LADDER = [10, 20, 30, 60, 100]
const snapController = (a) => {
  if (!(a > 0)) return null
  const hit = CTRL_LADDER.find(x => x >= a)
  if (hit) return hit
  return Math.ceil(a / 20) * 20
}
// PWM / MPPT 选型注记
const mpptAdvice = (panelW, sysV, ctrlA) => {
  if (!(panelW > 0)) return '—'
  if (panelW <= 200) return 'PWM 可用 / 建议 MPPT'
  return ctrlA >= 60 ? '建议 MPPT（大电流口径）' : '建议 MPPT'
}

// ---------- 格式化（避免浮点尾差） ----------
const trimZeros = (s) => (s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s)
const fmtWh = (wh) => {
  if (!isFinite(wh)) return '—'
  if (wh >= 1e6) return trimZeros((wh / 1e6).toPrecision(4)) + ' MWh'
  if (wh >= 1000) return trimZeros((wh / 1000).toPrecision(4)) + ' kWh'
  return trimZeros(wh.toPrecision(4)) + ' Wh'
}
const fmtNum = (v) => (!isFinite(v) ? '—' : trimZeros(Number(v.toPrecision(6)).toString()))
// __PURE_FNS_END__

// ---------- 状态 ----------
const SUN_HOURS = [3, 3.5, 4, 4.5, 5]

let rowSeq = 0
const nextRowId = () => ++rowSeq

const loadRows = ref([
  { id: nextRowId(), name: 'LED 照明', watts: 20, hours: 5 },
  { id: nextRowId(), name: '路由器', watts: 10, hours: 24 },
  { id: nextRowId(), name: '车载冰箱', watts: 60, hours: 10 }
])

const autonomyDays = ref(2)
const dod = ref(0.5)
const invEff = ref(0.9)
const sysV = ref(12)
const sunHours = ref(4)
const sysEff = ref(0.75)

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const addLoadRow = () => {
  if (loadRows.value.length >= 40) return
  loadRows.value.push({ id: nextRowId(), name: '', watts: 10, hours: 2 })
}
const removeLoadRow = (id) => {
  loadRows.value = loadRows.value.filter(r => r.id !== id)
}

const autonomyNum = computed(() => Number(autonomyDays.value))
const dodNum = computed(() => Number(dod.value))
const invEffNum = computed(() => Number(invEff.value))
const sysEffNum = computed(() => Number(sysEff.value))

// ① 日耗电量
const dailyWh = computed(() => sumDailyWh(loadRows.value))

// ② 电池
const usableWh = computed(() => dailyWh.value * autonomyNum.value)
const batteryResult = computed(() => batteryCapacity(dailyWh.value, autonomyNum.value, dodNum.value, invEffNum.value, Number(sysV.value)))

// ③ 板功率
const panelResult = computed(() => {
  const exact = panelExactW(dailyWh.value, Number(sunHours.value), sysEffNum.value)
  if (exact === null) return null
  const snap = snapPanel(exact)
  return { exact, snap, combo: panelCombo(snap) }
})

// ④ 控制器（按吸附后的板功率档位）
const panelWForCtl = computed(() => {
  const p = panelResult.value
  return p ? p.snap : 0
})
const controllerResult = computed(() => {
  const exact = controllerExactA(panelWForCtl.value, Number(sysV.value))
  if (exact === null) return null
  const snap = snapController(exact)
  return { exact, snap, mpptAdvice: mpptAdvice(panelWForCtl.value, Number(sysV.value), snap) }
})

// ---------- 输入持久化（键前缀为工具 id，仅交互回调写入） ----------
watch([loadRows, autonomyDays, dod, invEff, sysV, sunHours, sysEff], () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      loadRows: loadRows.value.map(r => ({ name: r.name, watts: Number(r.watts), hours: Number(r.hours) })),
      autonomyDays: autonomyDays.value,
      dod: dod.value,
      invEff: invEff.value,
      sysV: sysV.value,
      sunHours: sunHours.value,
      sysEff: sysEff.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
}, { deep: true })

// ---------- 相关工具 ----------
const relatedLinks = computed(() => ['battery-runtime', 'ups-runtime', 'battery-pack-calculator']
  .map((id) => tools.find((t) => t.id === id))
  .filter(Boolean))
</script>
