<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Leaf class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">碳排放计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">家庭年碳足迹估算：用电 / 燃气 / 出行 / 废弃物四组排放因子透明可查，植树抵消换算与减排建议</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线碳排放计算器（家庭 / 个人碳足迹）：分四组录入年度数据——① 用电（度/年，支持月度×12）② 燃气（立方米/年）
        ③ 出行（私家车分油车 / 电车、公交、火车、短途与长途飞行）④ 废弃物（垃圾 kg/周），
        按「用电 0.5306 kgCO₂/kWh（2023 年度全国电力平均排放因子）」等公开排放因子估算年总排放（吨 CO₂e），
        输出四组占比条形图、与中国人均（约 8 吨/年）对比、植树抵消换算（约 18.3 kg/棵·年口径）与
        「因子最大的组优先减排」建议卡。全部因子成表可查并注明来源年份；全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Leaf class="w-5 h-5 mr-2 text-primary" /> 年度生活数据
        </h2>

        <!-- ① 用电 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label for="cf-elec" class="text-sm font-medium text-foreground">① 用电</label>
            <div class="flex gap-1 text-[11px]">
              <button
                type="button"
                @click="elecMode = 'year'"
                class="px-2 py-1 rounded-md border transition"
                :class="elecMode === 'year' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border'"
              >度 / 年</button>
              <button
                type="button"
                @click="elecMode = 'month'"
                class="px-2 py-1 rounded-md border transition"
                :class="elecMode === 'month' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border'"
              >度 / 月 ×12</button>
            </div>
          </div>
          <input
            id="cf-elec"
            v-model.number="elecKwh"
            type="number"
            min="0"
            step="100"
            :placeholder="elecMode === 'year' ? '如 3000' : '如 250'"
            class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-[11px] text-muted-foreground mt-1">因子 0.5306 kgCO₂/kWh（2023 年度全国电力平均排放因子，生态环境部、国家统计局 2025 年发布）</p>
        </div>

        <!-- ② 燃气 -->
        <div>
          <label for="cf-gas" class="block text-sm font-medium text-foreground mb-2">② 天然气（立方米 / 年）</label>
          <input
            id="cf-gas"
            v-model.number="gasM3"
            type="number"
            min="0"
            step="10"
            placeholder="如 300"
            class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-[11px] text-muted-foreground mt-1">因子 2.162 kgCO₂/m³（《省级温室气体清单编制指南（试行）》缺省值）</p>
        </div>

        <!-- ③ 出行 -->
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">③ 出行（公里 / 年）</p>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-[11px] text-muted-foreground mb-1 block">油车公里（油耗 L/100km）</label>
              <div class="flex items-center gap-1">
                <input v-model.number="carKm" type="number" min="0" step="500" placeholder="10000" class="w-full min-w-0 px-2 py-1.5 border border-border bg-background rounded-lg text-foreground text-sm text-right" />
                <input v-model.number="carL100" type="number" min="0" step="0.5" placeholder="8" class="w-14 flex-shrink-0 px-2 py-1.5 border border-border bg-background rounded-lg text-foreground text-sm text-right" />
              </div>
            </div>
            <div>
              <label class="text-[11px] text-muted-foreground mb-1 block">电车公里（电耗 kWh/100km）</label>
              <div class="flex items-center gap-1">
                <input v-model.number="evKm" type="number" min="0" step="500" placeholder="0" class="w-full min-w-0 px-2 py-1.5 border border-border bg-background rounded-lg text-foreground text-sm text-right" />
                <input v-model.number="evKwh100" type="number" min="0" step="1" placeholder="15" class="w-14 flex-shrink-0 px-2 py-1.5 border border-border bg-background rounded-lg text-foreground text-sm text-right" />
              </div>
            </div>
            <div>
              <label class="text-[11px] text-muted-foreground mb-1 block">公交 / 地铁公里</label>
              <input v-model.number="busKm" type="number" min="0" step="500" placeholder="2000" class="w-full px-2 py-1.5 border border-border bg-background rounded-lg text-foreground text-sm text-right" />
            </div>
            <div>
              <label class="text-[11px] text-muted-foreground mb-1 block">火车 / 高铁公里</label>
              <input v-model.number="trainKm" type="number" min="0" step="500" placeholder="3000" class="w-full px-2 py-1.5 border border-border bg-background rounded-lg text-foreground text-sm text-right" />
            </div>
            <div>
              <label class="text-[11px] text-muted-foreground mb-1 block">短途飞行次数（单程 1000km）</label>
              <input v-model.number="flightShort" type="number" min="0" step="1" placeholder="0" class="w-full px-2 py-1.5 border border-border bg-background rounded-lg text-foreground text-sm text-right" />
            </div>
            <div>
              <label class="text-[11px] text-muted-foreground mb-1 block">长途飞行次数（单程 6000km）</label>
              <input v-model.number="flightLong" type="number" min="0" step="1" placeholder="0" class="w-full px-2 py-1.5 border border-border bg-background rounded-lg text-foreground text-sm text-right" />
            </div>
          </div>
          <p class="text-[11px] text-muted-foreground leading-relaxed">
            公交 0.04、高铁 0.025、飞机短途 0.15 / 长途 0.11 kgCO₂/人·公里；油车按 2.3 kgCO₂/L × 油耗，电车按电网因子 × 电耗（详见页底因子表）。
          </p>
        </div>

        <!-- ④ 废弃物 -->
        <div>
          <label for="cf-waste" class="block text-sm font-medium text-foreground mb-2">④ 生活垃圾（公斤 / 周）</label>
          <input
            id="cf-waste"
            v-model.number="wasteKgWeek"
            type="number"
            min="0"
            step="0.5"
            placeholder="如 5"
            class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-[11px] text-muted-foreground mt-1">因子 0.61 kgCO₂/kg（填埋口径，中科院院刊 2022）；× 52 周 / 年</p>
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

      <!-- 右侧：结果（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 年度碳足迹
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
          <!-- 主结果卡 -->
          <div class="bg-primary/10 rounded-lg p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <p class="text-xs text-muted-foreground mb-1">年总排放</p>
              <p class="text-3xl font-bold text-primary font-mono">{{ fmtTon(totalKg) }}<span class="text-sm font-normal"> 吨</span></p>
              <p class="text-[11px] text-muted-foreground mt-1">{{ fmtMoney(totalKg) }} kgCO₂e</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground mb-1">相当于中国人均（约 8 吨/年）</p>
              <p class="text-2xl font-bold text-foreground">{{ Math.round((totalKg / 8000) * 100) }}%</p>
              <p class="text-[11px] text-muted-foreground mt-1">Global Carbon Budget 2023 年口径</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground mb-1">植树抵消（约 18.3 kg/棵·年）</p>
              <p class="text-2xl font-bold text-foreground">{{ treesNeeded.toLocaleString('zh-CN') }}<span class="text-sm font-normal"> 棵</span></p>
              <p class="text-[11px] text-muted-foreground mt-1">种 1 年 → 抵消全部（口径见页底）</p>
            </div>
          </div>

          <!-- 分组占比条形图 -->
          <div class="space-y-3">
            <p class="text-sm font-semibold text-foreground">分组占比</p>
            <div v-for="g in groupBars" :key="g.key">
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="text-foreground font-medium">{{ g.label }}</span>
                <span class="font-mono text-muted-foreground">{{ fmtMoney(g.kg) }} kg（{{ g.percent }}%）</span>
              </div>
              <div class="h-2.5 bg-muted rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all" :class="g.cls" :style="{ width: g.width + '%' }"></div>
              </div>
            </div>
          </div>

          <!-- 减排建议卡 -->
          <div class="border border-green-500/20 bg-green-500/10 rounded-lg p-4 flex items-start gap-2">
            <Leaf class="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-semibold text-foreground">减排建议：从因子最大的「{{ topGroup.label }}」组下手</p>
              <p class="text-xs text-muted-foreground leading-relaxed mt-1">{{ topGroup.advice }}</p>
              <p class="text-[11px] text-muted-foreground leading-relaxed mt-1">
                通用三招：① 绿色电力（绿电交易 / 屋顶光伏）直接压低电的因子；② 少一趟 6000km 长途飞行 ≈ 少 990 kg，比省一年空调都多；
                ③ 垃圾分类与光盘行动让「废弃物」组直接变小。
              </p>
            </div>
          </div>
        </template>

        <!-- 空状态 -->
        <div v-else class="text-center text-muted-foreground py-16">
          <TriangleAlert class="w-10 h-10 mx-auto mb-3 text-yellow-500" />
          <p class="text-sm">请至少填写一组数据（用电 / 燃气 / 出行 / 废弃物），或点击「载入示例」查看演示。</p>
        </div>
      </div>
    </div>

    <!-- 口径与免责声明（页面固定） -->
    <div class="border border-border bg-muted/30 rounded-lg p-4 mb-8 flex items-start gap-2">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        排放因子均取自公开权威来源并注明年份（详见下方因子表）；个人 / 家庭碳足迹为估算口径，实际受区域电网、油品、车型与生活方式影响。
        植树抵换单棵树的年吸收量口径差异极大，结果仅供量级参考。<b class="text-foreground">本工具仅供教育科普，不构成碳核算或碳交易依据</b>；
        企业 / 产品碳核算请依据《企业温室气体排放核算方法与报告指南》及国家温室气体排放因子数据库。
      </p>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="bg-card border border-border rounded-lg mb-12 group">
      <summary class="flex items-center justify-between cursor-pointer select-none px-6 py-4">
        <span class="text-lg font-semibold text-foreground"><span class="text-primary mr-2">#</span>排放因子表、Scope 概念与常见问题</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform" />
      </summary>
      <div class="px-6 pb-6 space-y-6">
        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">计算公式</h3>
          <div class="bg-muted/50 rounded-xl p-4 text-sm text-foreground leading-relaxed space-y-2">
            <p><strong>总排放</strong>（kgCO₂e）= Σ（活动数据 × 排放因子）：用电量 × 0.5306 + 天然气 × 2.162 + 各交通方式公里 × 对应因子 + 垃圾 × 52 × 0.61。</p>
            <p><strong>私家车</strong>：油车 = 公里 ×（油耗 L/100km ÷ 100）× 2.3 kg/L；电车 = 公里 ×（电耗 kWh/100km ÷ 100）× 0.5306（随电网因子更新）。</p>
            <p><strong>飞行</strong>：短途按单程 1000 km × 0.15、长途按单程 6000 km × 0.11 kg/人·km（可在页面改次数估算）。</p>
            <p><strong>植树抵消</strong> = 总排放（kg）÷ 18.3 kg/棵·年（中文科普常用口径，单棵树口径差异极大，仅供量级参考）。</p>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">排放因子表（全部来源与年份）</h3>
          <div class="overflow-x-auto rounded-xl border border-border bg-muted/40 p-2">
            <table class="w-full text-xs">
              <thead>
                <tr class="text-muted-foreground border-b border-border">
                  <th class="px-2 py-1.5 text-left font-medium">项目</th>
                  <th class="px-2 py-1.5 text-right font-medium">因子</th>
                  <th class="px-2 py-1.5 text-left font-medium">来源与年份</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-border/40 last:border-0">
                  <td class="px-2 py-1.5 text-foreground">电力</td>
                  <td class="px-2 py-1.5 text-right font-mono text-foreground">0.5306 kgCO₂/kWh</td>
                  <td class="px-2 py-1.5 text-muted-foreground">2023 年度全国电力平均排放因子（生态环境部、国家统计局公告，2025 年 12 月发布；2022 年度 0.5366、2021 年度 0.5568 可作历史对照）</td>
                </tr>
                <tr class="border-b border-border/40 last:border-0">
                  <td class="px-2 py-1.5 text-foreground">天然气</td>
                  <td class="px-2 py-1.5 text-right font-mono text-foreground">2.162 kgCO₂/m³</td>
                  <td class="px-2 py-1.5 text-muted-foreground">《省级温室气体清单编制指南（试行）》（发改办气候〔2011〕1041 号）缺省值，按标准状况体积</td>
                </tr>
                <tr class="border-b border-border/40 last:border-0">
                  <td class="px-2 py-1.5 text-foreground">汽油（油车）</td>
                  <td class="px-2 py-1.5 text-right font-mono text-foreground">2.3 kgCO₂/L</td>
                  <td class="px-2 py-1.5 text-muted-foreground">常用核算缺省值（官方核算口径约 2.2~2.4 kg/L；按油耗 8 L/100km 折约 0.184 kg/km）</td>
                </tr>
                <tr class="border-b border-border/40 last:border-0">
                  <td class="px-2 py-1.5 text-foreground">电车</td>
                  <td class="px-2 py-1.5 text-right font-mono text-foreground">电网因子 × 电耗</td>
                  <td class="px-2 py-1.5 text-muted-foreground">0.5306 kg/kWh × 15 kWh/100km ≈ 0.080 kg/km（默认电耗，随年度因子更新）</td>
                </tr>
                <tr class="border-b border-border/40 last:border-0">
                  <td class="px-2 py-1.5 text-foreground">公交 / 地铁</td>
                  <td class="px-2 py-1.5 text-right font-mono text-foreground">0.04 kgCO₂/人·km</td>
                  <td class="px-2 py-1.5 text-muted-foreground">国内碳普惠方法学常用估算口径（英国 DEFRA 2023 本地公交约 0.104 kg，发达国家载客率更低仅作国际参考）</td>
                </tr>
                <tr class="border-b border-border/40 last:border-0">
                  <td class="px-2 py-1.5 text-foreground">火车 / 高铁</td>
                  <td class="px-2 py-1.5 text-right font-mono text-foreground">0.025 kgCO₂/人·km</td>
                  <td class="px-2 py-1.5 text-muted-foreground">高铁牵引阶段约 24.7 gCO₂/人·km（毛保华团队研究，中科院生态环境研究中心 2024 年刊文引述）</td>
                </tr>
                <tr class="border-b border-border/40 last:border-0">
                  <td class="px-2 py-1.5 text-foreground">飞机（短途 / 长途）</td>
                  <td class="px-2 py-1.5 text-right font-mono text-foreground">0.15 / 0.11 kgCO₂/人·km</td>
                  <td class="px-2 py-1.5 text-muted-foreground">英国 DEFRA 排放因子惯用值（短途国际 / 长途经济舱量级，含 Radiative Forcing 与否会影响数值）</td>
                </tr>
                <tr class="border-b border-border/40 last:border-0">
                  <td class="px-2 py-1.5 text-foreground">生活垃圾</td>
                  <td class="px-2 py-1.5 text-right font-mono text-foreground">0.61 kgCO₂/kg</td>
                  <td class="px-2 py-1.5 text-muted-foreground">填埋处理口径（《中国产品全生命周期》数据，中科院院刊 2022 年刊文引述；焚烧口径明显更低）</td>
                </tr>
                <tr class="border-b border-border/40 last:border-0">
                  <td class="px-2 py-1.5 text-foreground">植树抵消</td>
                  <td class="px-2 py-1.5 text-right font-mono text-foreground">18.3 kgCO₂/棵·年</td>
                  <td class="px-2 py-1.5 text-muted-foreground">中文科普常用口径（源自「森林每生长 1 m³ 蓄积约吸收 1.83 吨 CO₂」的简化换算）；单棵树口径差异极大，US EPA 城市树木口径约 0.06 吨/棵·年，仅供量级参考</td>
                </tr>
                <tr class="border-b border-border/40 last:border-0">
                  <td class="px-2 py-1.5 text-foreground">中国人均排放</td>
                  <td class="px-2 py-1.5 text-right font-mono text-foreground">约 8 吨 CO₂/年</td>
                  <td class="px-2 py-1.5 text-muted-foreground">Global Carbon Budget 2023 年化石燃料 CO₂ 口径（IEA《CO2 Emissions in 2023》量级一致）</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">Scope 概念科普：个人口径与企业核算的区别</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            企业碳核算（GHG Protocol）把排放分三类：<b class="text-foreground">Scope 1</b> 直接排放（自有锅炉烧气、公司油车烧油）、
            <b class="text-foreground">Scope 2</b> 外购电力 / 热力的间接排放（用电 × 电网因子，本页「用电」组就是 Scope 2 思路）、
            <b class="text-foreground">Scope 3</b> 价值链上下游的其他间接排放（通勤飞行、买的商品、垃圾处理……覆盖最广也最难算）。
            本工具把个人生活映射到这套框架：燃气 / 油车 ≈ Scope 1，用电 / 电车 ≈ Scope 2，公交火车飞机与废弃物 ≈ Scope 3。
            注意两点差异：企业核算用「全国电网平均因子」需按生态环境部最新年度公告取值；个人减排靠消费选择（绿电、出行方式、减量），
            而企业减排靠工艺与能源结构——两者因子口径不同，不能直接换算。站内配套工具：
            <a href="/tools/electricity-calculator/" class="text-primary hover:underline">电费计算器</a>（看懂家里用了多少度电）。
          </p>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">用电 3000 度排放多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">3000 kWh × 0.5306 kgCO₂/kWh = 1591.8 kg ≈ 1.59 吨 CO₂（按 2023 年度全国电力平均排放因子）。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么电车也排碳？</h3>
            <p class="text-sm text-muted-foreground mt-1">电车行驶本身零尾气，但发电端仍以火电为主：按电网平均因子 0.5306 kg/kWh、电耗 15 kWh/100km 折算约 0.08 kg/km，约为同油耗油车（约 0.18 kg/km）的一半不到，且随电网脱碳持续下降。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">坐飞机和高铁差多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">同为 1000 公里：飞机约 150 kg，高铁约 25 kg，相差约 6 倍。长途飞行单程 6000 km 约 660 kg——一次跨洲往返就抵得上普通家庭小半年的用电排放。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">种多少树能抵消一年排放？</h3>
            <p class="text-sm text-muted-foreground mt-1">按 18.3 kg/棵·年口径，1 吨排放约需 55 棵树吸收一年。单棵树吸收量因树种、树龄与气候差异极大（EPA 城市树木口径可达 60 kg/棵·年），植树只能作为补充手段，减排才是根本。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">个人一年排放多少算正常？</h3>
            <p class="text-sm text-muted-foreground mt-1">中国人均化石燃料 CO₂ 约 8 吨/年（2023 年 Global Carbon Budget 口径），全球平均约 4.7 吨；本工具只算「生活四组」，不含购买商品与公共服务的隐含碳，结果低于人均属正常。</p>
          </div>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'carbon-footprint-calculator'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Leaf, Calculator, Info, TriangleAlert, ChevronDown, RefreshCw, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '碳排放计算器 - 家庭碳足迹/个人年碳排放在线估算',
  description: '免费在线碳排放计算器：用电/燃气/出行(油车电车公交火车飞行)/废弃物四组年排放估算，排放因子透明可查（2023年度全国电力平均因子0.5306 kgCO2/kWh等），分组占比图、中国人均对比与植树抵消换算，附Scope概念科普与减排建议，纯浏览器本地计算',
  keywords: '碳排放计算器,家庭碳足迹,个人碳排放,碳减排计算,植树抵消碳排放,排放因子,Scope 1 2 3',
  author: '有条工具',
  ogTitle: '碳排放计算器 - 家庭碳足迹/个人年碳排放在线估算 | 有条工具',
  ogDescription: '四组排放因子透明可查，占比图 + 人均对比 + 植树抵消换算。',
  ogUrl: 'https://www.util.cn/tools/carbon-footprint-calculator',
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
          name: '碳排放计算器',
          url: 'https://www.util.cn/tools/carbon-footprint-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['用电 / 燃气 / 出行 / 废弃物四组估算', '排放因子成表可查并注明来源年份', '分组占比条形图', '中国人均排放对比', '植树抵消换算（注明口径）', '因子最大组优先减排建议', 'Scope 1/2/3 概念科普', '纯本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '实用工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '碳排放计算器', item: 'https://www.util.cn/tools/carbon-footprint-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '用电 3000 度排放多少？',
              acceptedAnswer: { '@type': 'Answer', text: '3000 kWh × 0.5306 kgCO₂/kWh = 1591.8 kg ≈ 1.59 吨 CO₂（按 2023 年度全国电力平均排放因子）。' }
            },
            {
              '@type': 'Question',
              name: '为什么电车也排碳？',
              acceptedAnswer: { '@type': 'Answer', text: '电车行驶本身零尾气，但按电网平均因子 0.5306 kg/kWh、电耗 15 kWh/100km 折算约 0.08 kg/km，约为油车的一半不到，且随电网脱碳持续下降。' }
            },
            {
              '@type': 'Question',
              name: '坐飞机和高铁差多少？',
              acceptedAnswer: { '@type': 'Answer', text: '同为 1000 公里：飞机约 150 kg，高铁约 25 kg，相差约 6 倍。' }
            },
            {
              '@type': 'Question',
              name: '种多少树能抵消一年排放？',
              acceptedAnswer: { '@type': 'Answer', text: '按 18.3 kg/棵·年口径，1 吨排放约需 55 棵树吸收一年；单棵树口径差异极大，植树只能作为补充手段。' }
            },
            {
              '@type': 'Question',
              name: '个人一年排放多少算正常？',
              acceptedAnswer: { '@type': 'Answer', text: '中国人均化石燃料 CO₂ 约 8 吨/年（2023 年 Global Carbon Budget 口径），全球平均约 4.7 吨；本工具只算生活四组，不含商品与服务的隐含碳。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 排放因子（自核两源、注明年份，详见页面因子表）：
const FACTORS = {
  electricity: 0.5306, // kgCO₂/kWh，2023 年度全国电力平均排放因子（生态环境部、国家统计局，2025-12-31 公告）
  gas: 2.162,          // kgCO₂/m³，《省级温室气体清单编制指南（试行）》2011 缺省值
  petrolPerL: 2.3,     // kgCO₂/L，汽油常用核算缺省值（官方口径约 2.2~2.4）
  busPkm: 0.04,        // kgCO₂/人·km，国内碳普惠常用估算口径
  trainPkm: 0.025,     // kgCO₂/人·km，高铁牵引阶段约 24.7 g（2024 年研究口径）
  flightShortPkm: 0.15, // kgCO₂/人·km，DEFRA 短途量级
  flightLongPkm: 0.11,  // kgCO₂/人·km，DEFRA 长途经济舱量级
  flightShortKm: 1000,  // 短途单程默认距离 km
  flightLongKm: 6000,   // 长途单程默认距离 km
  wastePerKg: 0.61,     // kgCO₂/kg 垃圾，填埋口径（中科院院刊 2022）
  treePerYear: 18.3,    // kgCO₂/棵·年，中文科普常用口径（EPA 城市树木约 0.06 t，差异大仅供量级）
  chinaPerCapitaKg: 8000 // 中国人均年排放约 8 吨（Global Carbon Budget 2023）
}

function numOr0(v) {
  const n = Number(v)
  return isFinite(n) && n > 0 ? n : 0
}

function round2(x) {
  return Math.round((Number(x) || 0) * 100) / 100
}

// ① 用电：支持「度/年」或「度/月 ×12」
function electricityKgOf(elecKwh, elecMode) {
  const kwh = numOr0(elecKwh) * (elecMode === 'month' ? 12 : 1)
  return round2(kwh * FACTORS.electricity)
}

// ② 燃气
function gasKgOf(gasM3) {
  return round2(numOr0(gasM3) * FACTORS.gas)
}

// ③ 出行分组（返回分项，便于建议卡）
function transportKgOf(input) {
  const car = numOr0(input.carKm) * (numOr0(input.carL100) / 100) * FACTORS.petrolPerL
  const ev = numOr0(input.evKm) * (numOr0(input.evKwh100) / 100) * FACTORS.electricity
  const bus = numOr0(input.busKm) * FACTORS.busPkm
  const train = numOr0(input.trainKm) * FACTORS.trainPkm
  const flightShort = numOr0(input.flightShort) * FACTORS.flightShortKm * FACTORS.flightShortPkm
  const flightLong = numOr0(input.flightLong) * FACTORS.flightLongKm * FACTORS.flightLongPkm
  return {
    car: round2(car),
    ev: round2(ev),
    bus: round2(bus),
    train: round2(train),
    flightShort: round2(flightShort),
    flightLong: round2(flightLong),
    total: round2(car + ev + bus + train + flightShort + flightLong)
  }
}

// ④ 废弃物：kg/周 × 52
function wasteKgOf(wasteKgWeek) {
  return round2(numOr0(wasteKgWeek) * 52 * FACTORS.wastePerKg)
}

// 植树抵消棵数（向上取整：少一棵都不算抵消）
function treesNeededOf(totalKg) {
  const t = Math.max(0, Number(totalKg) || 0)
  if (t <= 0) return 0
  return Math.ceil(t / FACTORS.treePerYear)
}

// 金额 / 数值展示：千分位 + 固定 2 位小数
function fmtMoney(n) {
  const v = round2(n)
  const sign = v < 0 ? '-' : ''
  const parts = Math.abs(v).toFixed(2).split('.')
  return sign + parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + parts[1]
}

// 吨展示：最多 2 位小数
function fmtTon(kg) {
  const v = round2((Number(kg) || 0) / 1000)
  return v.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

// ---------- 页面状态 ----------
const elecMode = ref('year')
const elecKwh = ref(3000)
const gasM3 = ref(300)
const carKm = ref(10000)
const carL100 = ref(8)
const evKm = ref(0)
const evKwh100 = ref(15)
const busKm = ref(2000)
const trainKm = ref(3000)
const flightShort = ref(0)
const flightLong = ref(0)
const wasteKgWeek = ref(5)

const input = computed(() => ({
  carKm: carKm.value,
  carL100: carL100.value,
  evKm: evKm.value,
  evKwh100: evKwh100.value,
  busKm: busKm.value,
  trainKm: trainKm.value,
  flightShort: flightShort.value,
  flightLong: flightLong.value
}))

const canCalc = computed(() => {
  return (
    numOr0(elecKwh.value) > 0 ||
    numOr0(gasM3.value) > 0 ||
    numOr0(carKm.value) > 0 ||
    numOr0(evKm.value) > 0 ||
    numOr0(busKm.value) > 0 ||
    numOr0(trainKm.value) > 0 ||
    numOr0(flightShort.value) > 0 ||
    numOr0(flightLong.value) > 0 ||
    numOr0(wasteKgWeek.value) > 0
  )
})

// ---------- 计算与展示派生 ----------
const elecKg = computed(() => electricityKgOf(elecKwh.value, elecMode.value))
const gasKg = computed(() => gasKgOf(gasM3.value))
const transport = computed(() => transportKgOf(input.value))
const wasteKg = computed(() => wasteKgOf(wasteKgWeek.value))

const totalKg = computed(() => round2(elecKg.value + gasKg.value + transport.value.total + wasteKg.value))

const GROUPS = computed(() => [
  {
    key: 'electricity',
    label: '① 用电',
    kg: elecKg.value,
    cls: 'bg-yellow-500',
    advice: '换一级能效电器、空调调高 1℃、习惯性拔插头，有条件的买绿电或装屋顶光伏——电的因子会随能源结构持续下降。'
  },
  {
    key: 'gas',
    label: '② 燃气',
    kg: gasKg.value,
    cls: 'bg-orange-500',
    advice: '燃气热水器换冷凝式 / 热泵型、冬季采暖控温、做饭盖锅盖——热泵能把「烧气采暖」的排放砍掉一半以上。'
  },
  {
    key: 'transport',
    label: '③ 出行',
    kg: transport.value.total,
    cls: 'bg-blue-500',
    advice: '中短途改高铁（约 0.025 kg/人·km）与公交地铁，减少长途飞行；换电车 + 充绿电是油车车主最大的单项减排。'
  },
  {
    key: 'waste',
    label: '④ 废弃物',
    kg: wasteKg.value,
    cls: 'bg-green-500',
    advice: '垃圾分类让可回收物不进填埋场、光盘行动减少厨余——厨余填埋是甲烷（约 28 倍温室效应）的主要来源。'
  }
])

const groupBars = computed(() => {
  const max = Math.max(...GROUPS.value.map((g) => g.kg), 1)
  return GROUPS.value.map((g) => ({
    ...g,
    percent: totalKg.value > 0 ? Math.round((g.kg / totalKg.value) * 100) : 0,
    width: Math.max(g.kg > 0 ? 3 : 0, Math.round((g.kg / max) * 100))
  }))
})

const topGroup = computed(() => GROUPS.value.reduce((a, b) => (b.kg > a.kg ? b : a), GROUPS.value[0]))

const treesNeeded = computed(() => treesNeededOf(totalKg.value))

// 复制结果（navigator.clipboard + alert）
function copyResult() {
  const lines = [
    '【家庭年碳足迹估算】',
    `年总排放：${fmtTon(totalKg.value)} 吨 CO₂e（${fmtMoney(totalKg.value)} kg）`,
    ...groupBars.value.map((g) => `${g.label}：${fmtMoney(g.kg)} kg（${g.percent}%）`),
    `相当于中国人均（约 8 吨/年）的 ${Math.round((totalKg.value / 8000) * 100)}%`,
    `植树抵消：约 ${treesNeeded.value} 棵树 × 1 年（18.3 kg/棵·年口径）`,
    '因子来源见工具页脚注；仅供教育科普，不构成碳核算依据。'
  ].join('\n')
  navigator.clipboard.writeText(lines).then(() => alert('已复制')).catch(() => alert('复制失败，请手动复制'))
}

function loadExample() {
  elecMode.value = 'year'
  elecKwh.value = 3000
  gasM3.value = 300
  carKm.value = 10000
  carL100.value = 8
  evKm.value = 0
  evKwh100.value = 15
  busKm.value = 2000
  trainKm.value = 3000
  flightShort.value = 0
  flightLong.value = 0
  wasteKgWeek.value = 5
}

function resetAll() {
  elecMode.value = 'year'
  elecKwh.value = ''
  gasM3.value = ''
  carKm.value = ''
  carL100.value = 8
  evKm.value = ''
  evKwh100.value = 15
  busKm.value = ''
  trainKm.value = ''
  flightShort.value = ''
  flightLong.value = ''
  wasteKgWeek.value = ''
}

onMounted(() => {
  addRecentTool('carbon-footprint-calculator')
})
</script>
