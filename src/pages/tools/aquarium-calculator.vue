<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Fish class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">鱼缸水体计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">方缸 / 圆柱缸 / L型底柜的净水量升数与加仑、加热棒功率吸附、每周换水量、海缸比重配盐、生物负载粗算，开缸养水一站算清</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线鱼缸水体计算器：输入外尺寸并可选扣除玻璃壁厚，得到内净容积（升，2 位小数）与美制 / 英制加仑双值；
        支持方形缸、圆柱缸（π r² h）与超白 L 型底柜（主缸 + 副缸两列）三种形状。
        在此基础上联动四组输出：按室温经验档推荐加热棒瓦数并吸附 50/100/200/300/500W 常用规格（&gt;200L 提示双棒分散布温）、
        每周 1/4~1/3 换水区间与自定义频率每次换水量（新缸首月减半）、海缸比重 1.000-1.026 滑块线性换算 ppt 并计算配盐公斤数（淡水盐浴另档）、
        按「1cm 鱼 / 2L 水」粗算可养总长与超载百分比。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 页面说明条 -->
    <p class="flex items-start gap-2 text-xs leading-relaxed bg-primary/10 border border-primary/20 text-foreground rounded-lg p-3 mb-6">
      <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
      <span>水量按玻璃内尺寸计算（外尺寸请减缸壁厚度）；加热功率、换水比例、盐度为水族通用经验口径，活体状态和地域气候请结合自身鱼种调整。</span>
    </p>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左栏：缸体输入 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Droplet class="w-5 h-5 mr-2 text-primary" /> 缸体尺寸
          </h2>

          <!-- 形状切换 -->
          <div class="flex rounded-lg border border-border overflow-hidden">
            <button
              v-for="tab in SHAPE_TABS"
              :key="tab.id"
              @click="shape = tab.id"
              class="flex-1 px-2 py-2 text-xs font-medium transition"
              :class="shape === tab.id ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground hover:bg-muted'"
            >{{ tab.label }}</button>
          </div>

          <!-- 方形缸 -->
          <template v-if="shape === 'rect'">
            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block text-xs font-medium text-foreground mb-1">长 (cm)</label>
                <input v-model.number="rect.l" type="number" min="1" step="0.1" class="input-base" placeholder="60" />
              </div>
              <div>
                <label class="block text-xs font-medium text-foreground mb-1">宽 (cm)</label>
                <input v-model.number="rect.w" type="number" min="1" step="0.1" class="input-base" placeholder="40" />
              </div>
              <div>
                <label class="block text-xs font-medium text-foreground mb-1">高 (cm)</label>
                <input v-model.number="rect.h" type="number" min="1" step="0.1" class="input-base" placeholder="40" />
              </div>
            </div>
          </template>

          <!-- 圆柱缸 -->
          <template v-if="shape === 'cyl'">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-medium text-foreground mb-1">直径 (cm)</label>
                <input v-model.number="cyl.d" type="number" min="1" step="0.1" class="input-base" placeholder="40" />
              </div>
              <div>
                <label class="block text-xs font-medium text-foreground mb-1">高 (cm)</label>
                <input v-model.number="cyl.h" type="number" min="1" step="0.1" class="input-base" placeholder="60" />
              </div>
            </div>
            <p class="text-[11px] text-muted-foreground">圆柱缸按内径 π r² h 计算：内径 = 直径 − 2×壁厚，内高 = 高 − 2×壁厚。</p>
          </template>

          <!-- L 型底柜 -->
          <template v-if="shape === 'lshape'">
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-2">
                <p class="text-xs font-medium text-foreground">主缸 (cm)</p>
                <input v-model.number="lshape.main.l" type="number" min="1" step="0.1" class="input-base" placeholder="长" aria-label="主缸长" />
                <input v-model.number="lshape.main.w" type="number" min="1" step="0.1" class="input-base" placeholder="宽" aria-label="主缸宽" />
                <input v-model.number="lshape.main.h" type="number" min="1" step="0.1" class="input-base" placeholder="高" aria-label="主缸高" />
              </div>
              <div class="space-y-2">
                <p class="text-xs font-medium text-foreground">副缸 (cm)</p>
                <input v-model.number="lshape.sub.l" type="number" min="1" step="0.1" class="input-base" placeholder="长" aria-label="副缸长" />
                <input v-model.number="lshape.sub.w" type="number" min="1" step="0.1" class="input-base" placeholder="宽" aria-label="副缸宽" />
                <input v-model.number="lshape.sub.h" type="number" min="1" step="0.1" class="input-base" placeholder="高" aria-label="副缸高" />
              </div>
            </div>
            <p class="text-[11px] text-muted-foreground">L 型底柜水体 = 主缸 + 副缸两列各自按内净尺寸求和后相加。</p>
          </template>

          <div>
            <label class="block text-xs font-medium text-foreground mb-1">玻璃壁厚 (mm，选填，每边各扣一层)</label>
            <input v-model.number="wallMm" type="number" min="0" step="1" class="input-base" placeholder="如 8，不填按外尺寸算" />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-medium text-foreground mb-1">室温 (℃)</label>
              <input v-model.number="roomTemp" type="number" min="0" max="45" step="0.5" class="input-base" placeholder="20" />
            </div>
            <div>
              <label class="block text-xs font-medium text-foreground mb-1">功率经验档</label>
              <select v-model="wplChoice" class="input-base">
                <option value="auto">按室温自动选档</option>
                <option v-for="tier in HEATER_WPL_TIERS" :key="tier.id" :value="tier.id">{{ tier.label }}</option>
              </select>
            </div>
          </div>

          <button
            @click="resetInputs"
            class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 恢复默认尺寸
          </button>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Play class="w-5 h-5 mr-2 text-primary" /> 快速预设
          </h2>
          <p class="text-xs text-muted-foreground -mt-1">点一下填入常见开缸配置，水量已手算核对，可再微调。</p>
          <button
            v-for="preset in PRESETS"
            :key="preset.id"
            @click="applyPreset(preset)"
            class="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-left transition"
          >
            <Play class="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span class="text-xs text-foreground">
              <span class="font-medium">{{ preset.name }}</span>
              <span class="text-muted-foreground"> · 净水量约 {{ preset.expectLiters }} L</span>
            </span>
          </button>
        </div>
      </div>

      <!-- 右栏：结果（占两列） -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 水量总览 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 class="text-lg font-semibold flex items-center">
              <Fish class="w-5 h-5 mr-2 text-primary" /> 水体容量
            </h2>
            <span class="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{{ currentShapeLabel }}</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="bg-primary/10 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">净水量（升）</p>
              <p class="text-3xl font-bold text-primary">{{ litersText }}</p>
              <p class="text-[11px] text-muted-foreground mt-1">升数 = 内长×内宽×内高 ÷ 1000，2 位小数</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">美制加仑 US gal</p>
              <p class="text-2xl font-bold text-foreground">{{ usGalText }}</p>
              <p class="text-[11px] text-muted-foreground mt-1">1 US gal = 3.785412 L，L ÷ 该值</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">英制加仑 UK gal</p>
              <p class="text-2xl font-bold text-foreground">{{ ukGalText }}</p>
              <p class="text-[11px] text-muted-foreground mt-1">1 UK gal = 4.54609 L（比美制大约 20%）</p>
            </div>
          </div>
        </div>

        <!-- 四组输出卡 -->
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <!-- 1 加热棒功率 -->
          <div class="bg-card border border-border rounded-lg p-5 space-y-3">
            <h3 class="text-sm font-semibold flex items-center">
              <Thermometer class="w-4 h-4 mr-1.5 text-primary" /> 加热棒功率
            </h3>
            <p class="text-2xl font-bold text-primary">{{ heaterMainText }}</p>
            <p class="text-xs text-muted-foreground leading-relaxed">
              计算值 {{ heaterRawText }} W（{{ litersText }} L × {{ wplText }} W/L，{{ wplSourceText }}），
              向上吸附到常用序列 50 / 100 / 200 / 300 / 500 W 中 ≥ 计算值的档位。
            </p>
            <p v-if="heater && heater.dual" class="flex items-start gap-1.5 text-xs text-amber-500 leading-relaxed">
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>水体超过 200L：建议双棒分置缸两端分散布温，温度场更均匀，单棒故障时也有冗余。</span>
            </p>
          </div>

          <!-- 2 换水量 -->
          <div class="bg-card border border-border rounded-lg p-5 space-y-3">
            <h3 class="text-sm font-semibold flex items-center">
              <Droplet class="w-4 h-4 mr-1.5 text-primary" /> 换水量
            </h3>
            <p class="text-2xl font-bold text-primary">每周 {{ changeRangeText }} L</p>
            <p class="text-xs text-muted-foreground">经验区间为水体 1/4 ~ 1/3，分次替换稳定水质。</p>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-medium text-foreground mb-1">你的频率（次/周）</label>
                <input v-model.number="changeFreq" type="number" min="1" max="7" step="1" class="input-base" />
              </div>
              <div>
                <label class="block text-xs font-medium text-foreground mb-1">每次换水比例（%）</label>
                <input v-model.number="changePct" type="number" min="5" max="100" step="5" class="input-base" />
              </div>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              按你的频率：每次约 <span class="font-semibold text-foreground">{{ perSessionText }} L</span>，
              每周累计 <span class="font-semibold text-foreground">{{ weeklyTotalText }} L</span>（{{ weeklyPctText }}）。
            </p>
            <label class="flex items-center gap-2 text-xs text-foreground cursor-pointer">
              <input v-model="newTank" type="checkbox" class="w-3.5 h-3.5 accent-primary" />
              新缸首月（硝化系统未稳，建议量减半）
            </label>
            <p v-if="newTank" class="flex items-start gap-1.5 text-xs text-amber-500 leading-relaxed">
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>已按新缸口径将建议区间减半——首月少量多次，避免水体理化指标剧烈波动冲垮硝化系统。</span>
            </p>
          </div>

          <!-- 3 盐度配制 -->
          <div class="bg-card border border-border rounded-lg p-5 space-y-3">
            <h3 class="text-sm font-semibold flex items-center">
              <Droplet class="w-4 h-4 mr-1.5 text-primary" /> 盐度配制
            </h3>
            <div class="flex rounded-lg border border-border overflow-hidden">
              <button
                v-for="m in SAL_MODES"
                :key="m.id"
                @click="salMode = m.id"
                class="flex-1 px-2 py-1.5 text-xs font-medium transition"
                :class="salMode === m.id ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground hover:bg-muted'"
              >{{ m.label }}</button>
            </div>

            <template v-if="salMode === 'marine'">
              <div class="flex items-center gap-3">
                <input
                  v-model.number="sg"
                  type="range" min="1" max="1.026" step="0.001"
                  class="flex-1 accent-primary"
                  aria-label="目标比重滑块"
                />
                <input v-model.number="sg" type="number" min="1" max="1.026" step="0.001" class="input-base w-24" aria-label="目标比重数值" />
              </div>
              <p class="text-xs text-muted-foreground leading-relaxed">
                目标比重 <span class="font-semibold text-foreground">{{ sgText }}</span> ↔ 盐度
                <span class="font-semibold text-foreground">{{ pptText }} ppt</span>（线性近似）。
              </p>
              <p class="text-lg font-bold text-primary">需海水盐约 {{ saltKgText }} kg</p>
              <p class="text-[11px] text-muted-foreground leading-relaxed">
                盐 kg = 升数 × ppt ÷ 1000（按 1 L 水 ≈ 1 kg、ppt ≈ g/kg 的近似口径）。
                比重-ppt 为线性近似（SG 1.000≈0 ppt、1.026≈35 ppt），精确请以盐度计 / 光学比重计为准；建议先兑新水再入缸。
              </p>
            </template>

            <template v-if="salMode === 'fresh'">
              <div>
                <label class="block text-xs font-medium text-foreground mb-1">盐浴浓度（‰，经验 3-5）</label>
                <input v-model.number="bathPermille" type="number" min="1" max="10" step="0.5" class="input-base" />
              </div>
              <p class="text-lg font-bold text-primary">需粗盐约 {{ bathSaltText }} g</p>
              <p class="text-[11px] text-muted-foreground leading-relaxed">
                淡水治病盐浴另档：3-5‰（≈ g/L）短时药浴，一般 15-30 分钟并持续充氧；
                无鳞鱼、虾螺与部分水草对盐敏感，先小缸试。全缸长期低盐（1-3‰）仅作应激缓解，不能替代对症下药。
              </p>
            </template>
          </div>

          <!-- 4 生物负载参考 -->
          <div class="bg-card border border-border rounded-lg p-5 space-y-3">
            <h3 class="text-sm font-semibold flex items-center">
              <Fish class="w-4 h-4 mr-1.5 text-primary" /> 生物负载参考
            </h3>
            <p class="text-xs text-muted-foreground">
              按「1 cm 鱼 / 2 L 水」粗算：本缸可养总长参考 <span class="font-semibold text-foreground">{{ capacityText }} cm</span>。
            </p>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-medium text-foreground mb-1">计划鱼数（条）</label>
                <input v-model.number="fishCount" type="number" min="0" step="1" class="input-base" />
              </div>
              <div>
                <label class="block text-xs font-medium text-foreground mb-1">成体体长（cm/条）</label>
                <input v-model.number="fishLen" type="number" min="0.5" step="0.5" class="input-base" />
              </div>
            </div>
            <label class="flex items-center gap-2 text-xs text-foreground cursor-pointer">
              <input v-model="doubleGold" type="checkbox" class="w-3.5 h-3.5 accent-primary" />
              金鱼 / 锦鲤等高污染鱼（负载翻倍计）
            </label>
            <p class="text-sm leading-relaxed">
              预估负载：<span class="text-2xl font-bold" :class="loadColorClass">{{ loadPctText }}</span>
              <span v-if="loadPercentResult !== null && loadPercentResult > 100" class="ml-2 font-medium text-amber-500">超载，建议减密或加强过滤</span>
              <span v-else-if="loadPercentResult !== null" class="ml-2 text-muted-foreground">密度尚可（留足冗余更稳）</span>
            </p>
            <p class="text-[11px] text-muted-foreground leading-relaxed">
              旁注：该口径只适合小型热带鱼粗估——金鱼 / 锦鲤污染翻倍计，异型（清道夫类）、魟等底栖食腐鱼排泄路径不同，属例外；
              实际以过滤能力、换水频率与鱼只状态为准。
            </p>
          </div>
        </div>

        <!-- 附加小卡 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="bg-card border border-border rounded-lg p-5 space-y-2">
            <h3 class="text-sm font-semibold flex items-center">
              <CheckCircle class="w-4 h-4 mr-1.5 text-green-600" /> 光照时长建议
            </h3>
            <p class="text-xs text-muted-foreground leading-relaxed">
              水草缸建议 <span class="font-semibold text-foreground">6-8 小时/天</span>（弱光草取下限），裸缸 / 三湖缸 <span class="font-semibold text-foreground">4-6 小时/天</span>；
              超时叠加肥水极易爆藻，建议配定时器固定开关灯。
            </p>
          </div>
          <div class="bg-card border border-border rounded-lg p-5 space-y-2">
            <h3 class="text-sm font-semibold flex items-center">
              <CheckCircle class="w-4 h-4 mr-1.5 text-green-600" /> 滤材容积参考
            </h3>
            <p class="text-xs text-muted-foreground leading-relaxed">
              经验口径滤材容积 ≥ 水体 3-5%：本缸约需 <span class="font-semibold text-foreground">{{ mediaRangeText }} L</span> 滤材；
              高密度养殖 / 裸缸锦鲤建议取上限并配合前置物理过滤棉。
            </p>
          </div>
        </div>
      </div>
    </div>

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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>鱼缸水体计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          这是一款面向观赏鱼、水草造景与海水缸爱好者的在线水体计算工具。输入缸体外尺寸后可选扣除玻璃壁厚，
          得到真正参与水体循环的内净容积（升 / 美制加仑 / 英制加仑），并在此基础上联动四组水族常用计算：
          加热棒功率（按室温经验档 1.0 / 1.5 / 2.0 W/L 并吸附常用瓦数）、每周换水量（1/4~1/3 区间与自定义频率）、
          海缸比重配盐（SG 1.000-1.026 与 ppt 线性近似换算）以及「1cm 鱼 / 2L 水」的生物负载粗算，
          另附灯照时长与滤材容积比经验建议。全部计算在浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么要算净容积而不是外尺寸容积？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          玻璃是有厚度的：一个 60cm 缸两侧各占 8mm，内长就只剩 58.4cm，整个缸的净容积比外尺寸少近 10%。
          而加热棒功率、换水量、下盐和下药物剂量全部按实际水量计——按外尺寸算会系统性高估水量，
          导致加热棒配小了升温慢、盐兑淡了比重不达标。本工具的壁厚输入按「每边各扣一层玻璃」处理，
          方形缸扣 2×壁厚，圆柱缸内径扣 2×壁厚、内高同样扣底顶各一层，L 型底柜则主缸副缸分别扣再求和。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">加热棒是「宁大勿小」还是刚好匹配？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          折中说法是「可以略大，不必刻意偏大」。功率略大（如按 1.0 W/L 算出 86W 而买 100W）到达目标温度更快、
           thermostat 停机时间更长，温控更从容；但过度超配（如一缸 60L 配 300W）会频繁短周期启停，
          继电器寿命与缸内温差反而不利。电费的主要变量不是标称瓦数而是室温与加盖情况——室温低、无盖散热快，
          加热棒实际通电时间成倍增加，此时该做的是上调经验档（1.5 / 2.0 W/L）并加缸盖，而不是无限堆瓦数。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">换水为什么不能一次全换？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          硝化细菌主要定植在滤材与底床的多孔表面，水体里只是过路客。一次全换等于把 pH、TDS、温度等理化指标瞬间拉回自来水状态，
          留在滤材里的菌群虽然还在，但水体中的氮循环被打断，残饵粪便集中分解容易引发氨氮尖峰；
          对虾、异型等敏感生物，渗透压骤变的打击更大。每周换 1/4~1/3 能稳定带走硝酸盐又不破坏系统；
          新缸首月菌群尚未站稳，本页提供「建议量减半」口径，少量多次更稳。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">比重、盐度、ppt 是哪三个数？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          比重（SG / 盐度计读数）是海水密度相对纯水的比值，海水圈常用 1.020-1.026；盐度是每千克海水的含盐克数，常用 ‰ 或 ppt（二者数值近似相等）；
          全球平均水平约 35 ppt，对应比重约 1.0264。本工具用线性近似把三者互相换算：SG 1.000≈0 ppt、SG 1.026≈35 ppt，
          所以 1.024 ≈ 35×0.024÷0.026 ≈ 32.3 ppt。配盐公斤数 = 升数×ppt÷1000。
          注意线性近似与温度（热胀冷缩影响比重读数）有关，精确配比请用光学比重计或电导盐度计复核。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">新缸开缸多久能放鱼？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          俗称「养水」，本质是等硝化菌群把「氨→亚硝酸盐→硝酸盐」两条链建起来：加水设备运转、投一点鱼食或爆氧培菌后，
          一般淡水缸 7-15 天、海缸活石爆藻 30 天左右可看氨与亚硝酸盐归零再分批进鱼。
          期间可用本页「新缸首月减半」口径控制换水量，进鱼密度先用负载卡的 50% 起步，逐步加鱼避免菌群跟不上氨源而翻缸。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">鱼缸水量为什么要按内净尺寸计算？</h3>
            <p class="text-sm text-muted-foreground mt-1">玻璃壁厚每边都在吃容积，60 缸扣 8mm 壁厚后净水量比外尺寸少近 10%。加热、换水、下盐、下药都按实际水量计，按外尺寸算会高估水量、配错剂量。本页壁厚输入支持自动扣除（每边各扣一层玻璃）。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">加热棒功率选大了会不会更费电？</h3>
            <p class="text-sm text-muted-foreground mt-1">维持温度消耗的电能主要取决于散热速度（室温、温差、是否加盖），标称 100W 与 200W 加热同一缸到温后长期电费接近，大棒只是到温更快、启停更从容。真正影响电费的是室温过低与不加盖——建议按本页经验档选到常用瓦数档位，超过 200L 水体用双棒分置。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">比重 1.024 该放多少盐？</h3>
            <p class="text-sm text-muted-foreground mt-1">本页按线性近似换算：SG 1.000≈0 ppt、1.026≈35 ppt，所以 1.024≈32.3 ppt；再按「盐 kg = 升数 × ppt ÷ 1000」估算，例如 360L 缸约需 11.63 kg 海水盐。近似口径受温度影响，精确请以光学比重计或盐度计复核。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">新缸多久能放鱼？换水有什么讲究？</h3>
            <p class="text-sm text-muted-foreground mt-1">先养水建立硝化系统，淡水缸一般 7-15 天、海缸活石爆藻约 30 天，待氨与亚硝酸盐归零再分批进鱼。日常每周换水 1/4~1/3，切勿一次全换导致理化指标骤变；新缸首月建议按减半口径少量多次。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'aquarium-calculator'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Fish, Thermometer, Droplet, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '鱼缸水体计算器 - 鱼缸容量升数/加热棒功率/换水量/盐度在线计算',
  description: '免费在线鱼缸水体计算器，方缸/圆柱缸/L型底柜净水量升数与加仑换算、加热棒功率经验档与常用瓦数吸附、每周换水量、海缸比重配盐、生物负载粗算，纯浏览器本地运行不上传',
  keywords: '鱼缸水体计算,鱼缸加热棒功率,鱼缸换水量,水族盐度配制,鱼缸容量升数',
  author: '有条工具',
  ogTitle: '鱼缸水体计算器 - 鱼缸容量升数/加热棒功率/换水量/盐度在线计算 | 有条工具',
  ogDescription: '输入尺寸即得净水量升数与加仑，联动加热棒功率、每周换水量、海缸配盐与养鱼密度粗算。',
  ogUrl: 'https://www.util.cn/tools/aquarium-calculator',
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
          name: '鱼缸水体计算器',
          url: 'https://www.util.cn/tools/aquarium-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['方缸/圆柱缸/L型底柜净水量计算', '壁厚扣除内净容积', '美制与英制加仑换算', '加热棒功率经验档与常用瓦数吸附', '每周换水区间与自定义换水量', '海缸比重-ppt线性换算配盐', '淡水盐浴另档', '1cm鱼/2L水生物负载粗算', '光照时长与滤材容积建议']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others' },
            { '@type': 'ListItem', position: 3, name: '鱼缸水体计算器', item: 'https://www.util.cn/tools/aquarium-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '鱼缸水量为什么要按内净尺寸计算？',
              acceptedAnswer: { '@type': 'Answer', text: '玻璃壁厚每边都在占用容积，60cm 缸扣 8mm 壁厚后净水量比外尺寸少近 10%。加热棒功率、换水量、下盐下药都按实际水量计，按外尺寸算会高估水量、配错剂量。本页壁厚输入按每边各扣一层玻璃自动扣除。' }
            },
            {
              '@type': 'Question',
              name: '加热棒功率选大了会不会更费电？',
              acceptedAnswer: { '@type': 'Answer', text: '维持温度耗电主要取决于散热速度（室温、温差、是否加盖），标称瓦数大一点到温更快、启停更从容，长期电费接近。室温低时应上调每升功率经验档并加盖；水体超过 200L 建议双棒分置两端。' }
            },
            {
              '@type': 'Question',
              name: '比重 1.024 该放多少盐？',
              acceptedAnswer: { '@type': 'Answer', text: '按线性近似：SG 1.000≈0 ppt、1.026≈35 ppt，所以 1.024≈32.3 ppt；盐公斤数=升数×ppt÷1000，360L 缸约需 11.63 kg 海水盐。近似口径受温度影响，精确请用光学比重计或盐度计复核。' }
            },
            {
              '@type': 'Question',
              name: '新缸多久能放鱼？换水有什么讲究？',
              acceptedAnswer: { '@type': 'Answer', text: '先养水建立硝化系统：淡水缸一般 7-15 天、海缸活石爆藻约 30 天，氨与亚硝酸盐归零后分批进鱼。日常每周换 1/4~1/3，不要一次全换以免理化指标骤变；新缸首月建议换水量减半、少量多次。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const CM3_PER_LITER = 1000
// 加仑换算：1 美制加仑 = 3.785411784 升；1 英制（帝国）加仑 = 4.54609 升（升 ÷ 系数即得加仑数）
const US_GALLON_L = 3.785411784
const UK_GALLON_L = 4.54609

function round2(n) { return Math.round(n * 100) / 100 }
function round3(n) { return Math.round(n * 1000) / 1000 }

// 方形缸净水量（L）：内尺寸 = 外尺寸 − 2×壁厚（每边各扣一层玻璃）；非法输入返回 null
function rectVolumeL(outerL, outerW, outerH, wallMm = 0) {
  const wall = Math.max(0, Number(wallMm) || 0) / 10
  const innerL = Number(outerL) - 2 * wall
  const innerW = Number(outerW) - 2 * wall
  const innerH = Number(outerH) - 2 * wall
  if (!(innerL > 0 && innerW > 0 && innerH > 0)) return null
  return round2((innerL * innerW * innerH) / CM3_PER_LITER)
}

// 圆柱缸净水量（L）：π r² h，内径 = 直径 − 2×壁厚，内高 = 高 − 2×壁厚（底顶各扣一层）
function cylinderVolumeL(diameter, height, wallMm = 0) {
  const wall = Math.max(0, Number(wallMm) || 0) / 10
  const innerD = Number(diameter) - 2 * wall
  const innerH = Number(height) - 2 * wall
  if (!(innerD > 0 && innerH > 0)) return null
  const r = innerD / 2
  return round2((Math.PI * r * r * innerH) / CM3_PER_LITER)
}

// 超白 L 型底柜净水量（L）：主缸 + 副缸两列各自按方形缸求和
function lShapeVolumeL(main, sub, wallMm = 0) {
  const a = rectVolumeL(main.l, main.w, main.h, wallMm)
  const b = rectVolumeL(sub.l, sub.w, sub.h, wallMm)
  if (a === null || b === null) return null
  return round2(a + b)
}

// 升 → 美制 / 英制加仑（双值，2 位小数）
function litersToGallons(liters) {
  if (!(Number(liters) > 0)) return null
  return { us: round2(Number(liters) / US_GALLON_L), uk: round2(Number(liters) / UK_GALLON_L) }
}

// 加热棒每升功率经验档：室温 ≥18℃ 取 1.0 W/L，15-18℃ 取 1.5 W/L，<15℃ 取 2.0 W/L
const HEATER_WPL_TIERS = [
  { id: 'standard', label: '常规档 1.0 W/L（室温≥18℃）', wpl: 1.0 },
  { id: 'cool', label: '偏冷档 1.5 W/L（15-18℃）', wpl: 1.5 },
  { id: 'cold', label: '寒冷档 2.0 W/L（<15℃）', wpl: 2.0 }
]

function wplByRoomTemp(roomTemp) {
  const t = Number(roomTemp)
  if (!Number.isFinite(t)) return 1.0
  if (t >= 18) return 1.0
  if (t >= 15) return 1.5
  return 2.0
}

// 常用加热棒瓦数序列（升序）
const HEATER_SERIES = [50, 100, 200, 300, 500]

// 加热棒推荐：W = 水体L × 每升功率；snap 吸附到序列中 ≥ 计算值的档位（超出 500 返回 null 并给多棒数）
function recommendHeater(liters, wpl) {
  const l = Number(liters)
  const w = Number(wpl)
  if (!(l > 0) || !(w > 0)) return null
  const raw = round2(l * w)
  const snap = HEATER_SERIES.find((x) => x >= raw) ?? null
  return {
    raw,
    snap,                                   // null 表示超出单棒常用档
    rodWatt: snap === null ? 500 : snap,    // 超档时按 500W 并联拆分
    rods: snap === null ? Math.ceil(raw / 500) : 1,
    dual: l > 200                           // >200L 建议双棒分散布温
  }
}

// 每周建议换水区间：1/4 ~ 1/3 水体；新缸首月减半
function weeklyChangeRange(liters, isNewTank = false) {
  const l = Number(liters)
  if (!(l > 0)) return null
  const factor = isNewTank ? 0.5 : 1
  return { min: round2((l / 4) * factor), max: round2((l / 3) * factor) }
}

// 自定义：每次换水量 = 升数 × 比例%（非法比例返回 null）
function changePerSession(liters, fractionPercent) {
  const l = Number(liters)
  const p = Number(fractionPercent)
  if (!(l > 0) || !(p > 0) || p > 100) return null
  return round2((l * p) / 100)
}

// 比重 → ppt 盐度（线性近似口径：SG 1.000≈0 ppt、SG 1.026≈35 ppt；精确换算请用地温盐度计/光学比重计）
function sgToPpt(sg) {
  const v = Number(sg)
  if (!(v >= 1 && v <= 1.026)) return null
  return round2((35 * (v - 1)) / 0.026)
}

// ppt → 比重（同一线性近似反向式，比重保留 3 位小数与滑块步长一致）
function pptToSg(ppt) {
  const p = Number(ppt)
  if (!(p >= 0 && p <= 35)) return null
  return round3(1 + (p * 0.026) / 35)
}

// 配盐公斤数：kg = 升数 × ppt ÷ 1000（按 1L≈1kg、ppt≈g/kg 近似）
function saltKgNeeded(liters, ppt) {
  const l = Number(liters)
  const p = Number(ppt)
  if (!(l > 0) || !(p > 0)) return null
  return round2((l * p) / 1000)
}

// 淡水治病盐浴：‰ ≈ g/L，经验 3-5；超出 1-10 范围视为非法
function freshwaterSaltGrams(liters, perMille) {
  const l = Number(liters)
  const m = Number(perMille)
  if (!(l > 0) || !(m > 0) || m > 10) return null
  return round2(l * m)
}

// 生物负载：可养总长 ≈ 升数 × 2（1cm 鱼 / 2L 水）
function stockingCapacityCm(liters) {
  const l = Number(liters)
  if (!(l > 0)) return null
  return round2(l * 2)
}

// 负载百分比 = 计划总长(条数×体长，金鱼/锦鲤翻倍) ÷ 可养总长 × 100，取整；>100 即超载
function loadPercent(fishCount, bodyCm, liters, doubled) {
  const n = Number(fishCount)
  const len = Number(bodyCm)
  const l = Number(liters)
  if (!(l > 0) || !(n >= 0) || !(len > 0)) return null
  const totalCm = n * len * (doubled ? 2 : 1)
  return Math.round((totalCm / (l * 2)) * 100)
}

// 滤材容积比经验档：≥ 水体 3-5%
function filterMediaRange(liters) {
  const l = Number(liters)
  if (!(l > 0)) return null
  return { min: round2(l * 0.03), max: round2(l * 0.05) }
}

const SHAPE_TABS = [
  { id: 'rect', label: '方形缸' },
  { id: 'cyl', label: '圆柱缸' },
  { id: 'lshape', label: 'L型底柜' }
]
const SAL_MODES = [
  { id: 'marine', label: '海缸比重' },
  { id: 'fresh', label: '淡水盐浴' }
]

// 快速预设（expectLiters 为手算断言值：P1 内净 58.4×38.4×38.4/1000=86.11L；P2 外尺寸 120×50×60/1000=360L）
const PRESETS = [
  {
    id: 'planted60', name: '60 草缸 · 壁厚8mm · 室温25℃', shape: 'rect',
    rect: { l: 60, w: 40, h: 40 }, cyl: { d: 40, h: 60 },
    lshapeMain: { l: 100, w: 40, h: 40 }, lshapeSub: { l: 40, w: 40, h: 40 },
    wallMm: 8, roomTemp: 25, wplChoice: 'auto',
    salMode: 'fresh', sg: 1.0, bathPermille: 3,
    fishCount: 12, fishLen: 4, expectLiters: 86.11
  },
  {
    id: 'marine120', name: '120 海缸 · 比重1.024 · 室温20℃', shape: 'rect',
    rect: { l: 120, w: 50, h: 60 }, cyl: { d: 40, h: 60 },
    lshapeMain: { l: 100, w: 40, h: 40 }, lshapeSub: { l: 40, w: 40, h: 40 },
    wallMm: 0, roomTemp: 20, wplChoice: 'auto',
    salMode: 'marine', sg: 1.024, bathPermille: 3,
    fishCount: 6, fishLen: 10, expectLiters: 360
  }
]

// ---------- 响应式状态 ----------
const shape = ref('rect')
const rect = reactive({ l: 60, w: 40, h: 40 })
const cyl = reactive({ d: 40, h: 60 })
const lshape = reactive({ main: { l: 100, w: 40, h: 40 }, sub: { l: 40, w: 40, h: 40 } })
const wallMm = ref(0)
const roomTemp = ref(20)
const wplChoice = ref('auto')
const newTank = ref(false)
const changeFreq = ref(1)
const changePct = ref(25)
const salMode = ref('marine')
const sg = ref(1.024)
const bathPermille = ref(3)
const fishCount = ref(12)
const fishLen = ref(4)
const doubleGold = ref(false)
const seoContentVisible = ref(true)

// ---------- 派生结果 ----------
const currentShapeLabel = computed(() => {
  const tab = SHAPE_TABS.find((t) => t.id === shape.value)
  return tab ? tab.label : '方形缸'
})

const waterLiters = computed(() => {
  if (shape.value === 'rect') return rectVolumeL(rect.l, rect.w, rect.h, wallMm.value)
  if (shape.value === 'cyl') return cylinderVolumeL(cyl.d, cyl.h, wallMm.value)
  return lShapeVolumeL(lshape.main, lshape.sub, wallMm.value)
})

const gallons = computed(() => litersToGallons(waterLiters.value))

const effectiveWpl = computed(() => {
  if (wplChoice.value !== 'auto') {
    const tier = HEATER_WPL_TIERS.find((t) => t.id === wplChoice.value)
    if (tier) return tier.wpl
  }
  return wplByRoomTemp(roomTemp.value)
})

const heater = computed(() => recommendHeater(waterLiters.value, effectiveWpl.value))

const changeRange = computed(() => weeklyChangeRange(waterLiters.value, newTank.value))
const perSession = computed(() => changePerSession(waterLiters.value, changePct.value))
const weeklyTotal = computed(() => {
  if (perSession.value === null || !(Number(changeFreq.value) > 0)) return null
  return round2(perSession.value * Number(changeFreq.value))
})
const weeklyPct = computed(() => {
  if (weeklyTotal.value === null || !(waterLiters.value > 0)) return null
  return Math.round((weeklyTotal.value / waterLiters.value) * 100)
})

const ppt = computed(() => sgToPpt(sg.value))
const saltKg = computed(() => saltKgNeeded(waterLiters.value, ppt.value))
const bathSaltG = computed(() => freshwaterSaltGrams(waterLiters.value, bathPermille.value))

const capacityCm = computed(() => stockingCapacityCm(waterLiters.value))
const loadPercentResult = computed(() => loadPercent(fishCount.value, fishLen.value, waterLiters.value, doubleGold.value))
const mediaRange = computed(() => filterMediaRange(waterLiters.value))

// ---------- 展示文本 ----------
function fmt(n) { return n === null || n === undefined || !Number.isFinite(Number(n)) ? '—' : String(n) }

const litersText = computed(() => fmt(waterLiters.value))
const usGalText = computed(() => (gallons.value ? String(gallons.value.us) : '—'))
const ukGalText = computed(() => (gallons.value ? String(gallons.value.uk) : '—'))
const wplText = computed(() => effectiveWpl.value.toFixed(1))
const wplSourceText = computed(() =>
  wplChoice.value === 'auto' ? `按室温 ${fmt(Number.isFinite(Number(roomTemp.value)) ? Number(roomTemp.value) : null)}℃ 自动档` : '手动指定档位'
)
const heaterRawText = computed(() => (heater.value ? String(heater.value.raw) : '—'))
const heaterMainText = computed(() => {
  if (!heater.value) return '—'
  return heater.value.snap === null
    ? `${heater.value.rods} × ${heater.value.rodWatt}W`
    : `${heater.value.snap}W × 1`
})
const changeRangeText = computed(() => (changeRange.value ? `${changeRange.value.min} ~ ${changeRange.value.max}` : '—'))
const perSessionText = computed(() => fmt(perSession.value))
const weeklyTotalText = computed(() => fmt(weeklyTotal.value))
const weeklyPctText = computed(() => (weeklyPct.value === null ? '—' : `约 ${weeklyPct.value}% 水体`))
const sgText = computed(() => {
  const v = Number(sg.value)
  return Number.isFinite(v) ? v.toFixed(3) : '—'
})
const pptText = computed(() => (ppt.value === null ? '—' : `≈ ${ppt.value} ppt`))
const saltKgText = computed(() => (saltKg.value === null ? '—' : `${saltKg.value} kg`))
const bathSaltText = computed(() => (bathSaltG.value === null ? '—' : `${bathSaltG.value} g`))
const capacityText = computed(() => (capacityCm.value === null ? '—' : `≈ ${capacityCm.value}`))
const loadPctText = computed(() => (loadPercentResult.value === null ? '—' : `${loadPercentResult.value}%`))
const loadColorClass = computed(() => {
  if (loadPercentResult.value === null) return 'text-muted-foreground'
  return loadPercentResult.value > 100 ? 'text-amber-500' : 'text-green-600'
})
const mediaRangeText = computed(() => (mediaRange.value ? `${mediaRange.value.min} ~ ${mediaRange.value.max}` : '—'))

// ---------- 操作（纯本地状态，SSR 安全） ----------
function fillInputs(p) {
  shape.value = p.shape
  Object.assign(rect, p.rect)
  Object.assign(cyl, p.cyl)
  Object.assign(lshape.main, p.lshapeMain)
  Object.assign(lshape.sub, p.lshapeSub)
  wallMm.value = p.wallMm
  roomTemp.value = p.roomTemp
  wplChoice.value = p.wplChoice
  salMode.value = p.salMode
  sg.value = p.sg
  bathPermille.value = p.bathPermille
  fishCount.value = p.fishCount
  fishLen.value = p.fishLen
  newTank.value = false
  changeFreq.value = 1
  changePct.value = 25
  doubleGold.value = false
}

function applyPreset(preset) {
  fillInputs(preset)
}

const DEFAULT_INPUTS = {
  shape: 'rect',
  rect: { l: 60, w: 40, h: 40 },
  cyl: { d: 40, h: 60 },
  lshapeMain: { l: 100, w: 40, h: 40 },
  lshapeSub: { l: 40, w: 40, h: 40 },
  wallMm: 0, roomTemp: 20, wplChoice: 'auto',
  salMode: 'marine', sg: 1.024, bathPermille: 3,
  fishCount: 12, fishLen: 4
}

function resetInputs() {
  fillInputs(DEFAULT_INPUTS)
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('aquarium-calculator')
})
</script>

<style scoped>
/* 统一输入控件外观（语义 token） */
.input-base {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background-color: var(--background);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: var(--foreground);
}
.input-base:focus {
  outline: none;
  box-shadow: 0 0 0 2px hsl(var(--ring) / 0.4);
}
.input-base::placeholder {
  color: var(--muted-foreground);
  opacity: 0.6;
}
</style>
