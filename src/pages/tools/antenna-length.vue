<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Send class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">天线长度计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">λ/4 单极子、λ/2 偶极子与 5/8λ GP 天线长度，速度因子修正与地网建议</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线天线长度计算器：按 λ = 300/f(MHz) 计算自由空间波长，支持 λ/4 单极子（GP）、λ/2 偶极子（DP）与 5/8λ GP 三种模式，
        用速度因子 VF（裸铜线 / PVC 皮线 / 同轴振子 / 伸缩鞭）把物理长度修正到实际剪线尺寸；
        偶极子给出总长与两臂各半长，单极子给出鞭长与 4 根 λ/4 下垂 45° 地网建议，5/8λ 附底部匹配线圈注记。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        计算口径：自由空间波长 λ = 300 ÷ f(MHz)（米），物理长度 = 系数 × λ × VF。
        系数：λ/4 单极子 0.25、λ/2 偶极子 0.5、5/8λ GP 0.625。速度因子 VF 是导线/介质让电长度"缩水"的修正，
        本页预设为经验典型值——<span class="text-foreground font-medium">成品以实测 SWR 最低点的频率为准微调</span>，
        剪长留余、逐步修短比一次剪到位更稳。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算器列 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 参数输入与结果 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 天线长度计算
          </h2>

          <!-- 模式 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">天线模式</label>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              <button
                @click="mode = 'gp-quarter'"
                :class="mode === 'gp-quarter' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >λ/4 单极子（GP）</button>
              <button
                @click="mode = 'dipole'"
                :class="mode === 'dipole' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >λ/2 偶极子（DP）</button>
              <button
                @click="mode = 'gp-five-eighth'"
                :class="mode === 'gp-five-eighth' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >5/8λ GP（带匹配线圈）</button>
            </div>
          </div>

          <!-- 频率 -->
          <div>
            <label for="al-freq" class="block text-sm font-medium text-foreground mb-1.5">工作频率（MHz）</label>
            <div class="flex flex-wrap gap-1.5 mb-2">
              <button
                v-for="p in FREQ_PRESETS"
                :key="p.v"
                @click="freqMhz = p.v"
                :class="freqMhz === p.v ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              >{{ p.label }}</button>
            </div>
            <input
              id="al-freq"
              v-model.number="freqMhz"
              type="number"
              min="0.1"
              step="0.1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 433"
            >
          </div>

          <!-- 速度因子 -->
          <div>
            <label for="al-vf" class="block text-sm font-medium text-foreground mb-1.5">速度因子 VF</label>
            <div class="flex flex-wrap gap-1.5 mb-2">
              <button
                v-for="p in VF_PRESETS"
                :key="p.v"
                @click="vf = p.v"
                :class="vf === p.v ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              >{{ p.label }} · {{ p.v }}</button>
            </div>
            <input
              id="al-vf"
              v-model.number="vf"
              type="number"
              min="0.5"
              max="1"
              step="0.01"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="0~1，如 0.95"
            >
            <p class="text-xs text-muted-foreground mt-1">
              预设为经验典型值；实际导线的 VF 随绝缘层、线径与安装环境变化，以实测
              <NuxtLink to="/tools/swr-calculator" class="text-primary hover:underline">SWR 最低</NuxtLink>的频率为准微调
            </p>
          </div>

          <!-- 结果：λ/4 单极子 -->
          <div v-if="result && mode === 'gp-quarter'" class="p-4 rounded-lg border border-primary/30 bg-primary/10 space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">自由空间波长 λ</p>
                <p class="text-2xl font-bold text-foreground">{{ fmt(result.waveM, 4) }} <span class="text-sm">m</span></p>
                <p class="text-xs text-muted-foreground mt-1">{{ fmt(result.waveCm, 1) }} cm</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">鞭长（λ/4 × VF）</p>
                <p class="text-2xl font-bold text-primary">{{ fmt(result.lengthM, 4) }} <span class="text-sm">m</span></p>
                <p class="text-xs text-muted-foreground mt-1">{{ fmt(result.lengthCm, 2) }} cm（剪线留余，逐步修短）</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">地网每根（λ/4 × VF）</p>
                <p class="text-2xl font-bold text-foreground">{{ fmt(result.radialM, 4) }} <span class="text-sm">m</span></p>
                <p class="text-xs text-muted-foreground mt-1">4 根，下垂约 45°</p>
              </div>
            </div>
            <div class="pt-3 border-t border-primary/20 text-sm text-muted-foreground leading-relaxed">
              地网建议：底部接 <span class="text-foreground font-medium">4 根 λ/4 地网（辐射瓣），向下垂约 45° 张开</span>。
              下垂角度能把馈电阻抗从约 36Ω 抬向 50Ω，配合 50Ω 同轴直馈更接近谐振；地网略长无妨，
              太短会抬高谐振频率。没有地网的单极子馈电点没有回路，效率极低。
            </div>
          </div>

          <!-- 结果：λ/2 偶极子 -->
          <div v-else-if="result && mode === 'dipole'" class="p-4 rounded-lg border border-primary/30 bg-primary/10 space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">自由空间波长 λ</p>
                <p class="text-2xl font-bold text-foreground">{{ fmt(result.waveM, 4) }} <span class="text-sm">m</span></p>
                <p class="text-xs text-muted-foreground mt-1">{{ fmt(result.waveCm, 1) }} cm</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">偶极子总长（λ/2 × VF）</p>
                <p class="text-2xl font-bold text-primary">{{ fmt(result.lengthM, 4) }} <span class="text-sm">m</span></p>
                <p class="text-xs text-muted-foreground mt-1">{{ fmt(result.lengthCm, 2) }} cm</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">两臂各半长</p>
                <p class="text-2xl font-bold text-foreground">{{ fmt(result.armM, 4) }} <span class="text-sm">m</span></p>
                <p class="text-xs text-muted-foreground mt-1">每臂 {{ fmt(result.armCm, 2) }} cm，中点馈电</p>
              </div>
            </div>
            <div class="pt-3 border-t border-primary/20 text-sm text-muted-foreground leading-relaxed">
              偶极子中点馈电（阻抗约 73Ω，接近 50Ω 系统），两侧振子对称、长度相等；
              两臂从绝缘支撑上水平架设，离地越高越接近理论方向图。总长先按计算值多留 2~3%，
              架起来实测 SWR 谷点频率后再修短。
            </div>
          </div>

          <!-- 结果：5/8λ GP -->
          <div v-else-if="result && mode === 'gp-five-eighth'" class="p-4 rounded-lg border border-primary/30 bg-primary/10 space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">自由空间波长 λ</p>
                <p class="text-2xl font-bold text-foreground">{{ fmt(result.waveM, 4) }} <span class="text-sm">m</span></p>
                <p class="text-xs text-muted-foreground mt-1">{{ fmt(result.waveCm, 1) }} cm</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">辐射体长度（5/8λ × VF）</p>
                <p class="text-2xl font-bold text-primary">{{ fmt(result.lengthM, 4) }} <span class="text-sm">m</span></p>
                <p class="text-xs text-muted-foreground mt-1">{{ fmt(result.lengthCm, 2) }} cm</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">地网每根（λ/4 × VF）</p>
                <p class="text-2xl font-bold text-foreground">{{ fmt(result.radialM, 4) }} <span class="text-sm">m</span></p>
                <p class="text-xs text-muted-foreground mt-1">4 根，下垂约 45°</p>
              </div>
            </div>
            <div class="pt-3 border-t border-primary/20 text-sm text-muted-foreground leading-relaxed">
              <span class="text-foreground font-medium">匹配线圈注记：</span>5/8λ 的输入端呈容性、阻抗明显高于 50Ω（约 130Ω 量级），
              需在底部串接一个小加感线圈（或 γ 匹配 / 抽头线圈）抵消容抗并把阻抗变换到 50Ω。
              相比 λ/4 有约 1.5~2dB 的低仰角增益收益，但线圈参数按频段调试，以实测 SWR 为准。
            </div>
          </div>

          <!-- 参数无效 -->
          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">暂无法计算</p>
              <p class="text-xs text-muted-foreground mt-1">请检查参数：工作频率 &gt; 0，速度因子 VF 在 0.5~1 之间。</p>
            </div>
          </div>

          <p class="text-xs leading-relaxed text-muted-foreground">
            <span class="text-foreground font-medium">长度不够时（加感缩短）：</span>鞭长装不下时可在底部串接加感线圈，
            用电感把剩余的电长度"补回来"，天线物理变短但电长度仍是 λ/4——代价是带宽变窄、效率略降；
            也可用螺旋绕法（弹簧天线）把导线绕起来等效拉长。先保证电长度谐振，再谈匹配。
          </p>
        </div>

        <!-- 常用频段速查表 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Table class="w-5 h-5 mr-2 text-primary" /> 常用频段长度速查（VF = {{ fmt(vf, 2) }}）
          </h2>
          <div v-if="quickTable.length" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-muted-foreground">
                  <th class="text-left py-2 pr-3 font-medium">频段</th>
                  <th class="text-right py-2 px-3 font-medium">波长 λ</th>
                  <th class="text-right py-2 px-3 font-medium">λ/4 鞭长</th>
                  <th class="text-right py-2 px-3 font-medium">λ/2 总长</th>
                  <th class="text-right py-2 pr-1 font-medium">5/8λ 长度</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in quickTable"
                  :key="row.freq"
                  class="border-t border-border/50"
                  :class="freqMhz === row.freq ? 'bg-primary/10' : ''"
                >
                  <td class="py-2.5 pr-3 font-medium text-foreground whitespace-nowrap">
                    {{ row.freq }} MHz
                    <span v-if="freqMhz === row.freq" class="ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/15 text-primary">当前</span>
                  </td>
                  <td class="py-2.5 px-3 text-right text-muted-foreground">{{ fmt(row.waveCm, 1) }} cm</td>
                  <td class="py-2.5 px-3 text-right font-medium text-foreground">{{ fmt(row.quarterCm, 2) }} cm</td>
                  <td class="py-2.5 px-3 text-right font-medium text-foreground">{{ fmt(row.halfCm, 2) }} cm</td>
                  <td class="py-2.5 pr-1 text-right font-medium text-foreground">{{ fmt(row.fiveEighthCm, 2) }} cm</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            表内数值由与上方计算器同一组函数按当前 VF 生成；单极子取鞭长、偶极子取总长（两臂各半）。
            27MHz CB 的 λ/4 约 2.6~2.8m，868/915MHz 的 γ 鞭只有十几厘米——频率越高天线越短，VF 的差异也越明显。
          </p>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 地网与安装 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Waves class="w-5 h-5 mr-2 text-primary" /> 地网的作用与安装
          </h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">镜像原理：</span>单极子只有"半根"振子，地网充当镜像，把缺失的另一半"虚拟"出来；没有地网，馈电点没有回流路径，效率极低。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">4 根 45° 下垂：</span>水平放平馈电阻抗约 36Ω，下垂 45° 抬到接近 50Ω，与 50Ω 同轴匹配更好；数量 3~4 根起，越多越接近理想地面。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">车载与手持：</span>车顶金属壳、手持机的人体/机身都是"不完整地网"，方向图和谐振点会偏移，更要以实测为准。</span>
            </li>
          </ul>
        </div>

        <!-- 经验提示卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 实用提示
          </h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">先长后短：</span>按计算值多留 2~3%，架好后边测边剪——天线只能剪短，接不回去。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">调谐顺序：</span>先修长度让 SWR 谷点落进目标频段（谐振），再做匹配网络处理阻抗；顺序反了是白折腾。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">VF 不确定：</span>裸铜线先按 0.95 起算，带皮线/缠绕线圈取更低值；实测谷点频率偏高说明剪短了，换长线重来。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">谷点看 SWR：</span>用
                <NuxtLink to="/tools/swr-calculator" class="text-primary hover:underline">驻波比换算</NuxtLink>
                把实测 SWR 换成反射损耗，判断"够不够好"再决定要不要继续修。</span>
            </li>
          </ul>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>什么是天线长度计算</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          天线是一段"电长度"等于特定波长分数的导体：λ/4 单极子配地网、λ/2 偶极子是两根最经典的谐振结构，
          5/8λ GP 用略长的辐射体换取低仰角增益。天线长度计算器把目标频率换算成自由空间波长
          λ = 300/f(MHz)，再乘以结构系数（0.25 / 0.5 / 0.625）和速度因子 VF，得到可以直接剪线的物理长度。
          物理长度总比"自由空间 λ÷4"短几个百分点，因为导线里的波跑得比真空慢，且导体末端有"末端效应"。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么要乘速度因子 VF</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          无线电波在真空/空气中的速度是 c，但在导体表面和绝缘介质里传播速度更低，波长相应"缩短"；
          同时电流走到导线末端会遭遇开路反射，等效电长度比物理长度略长（末端效应）。
          两个效应合起来，就是一根"恰好谐振"的偶极子物理总长约等于 0.95λ 而不是 0.5λ×2。
          VF 取决于导线粗细、绝缘皮介电常数与周围物体：裸铜线约 0.95，PVC 皮线约 0.93，
          同轴振子（介质加载大）约 0.88，伸缩鞭约 0.97。这些都是经验起点——
          <span class="text-foreground font-medium">真正的 VF 以实测 SWR 最低点的频率为准反推微调</span>，
          环境不同（金属屋顶、窗框、人体）都会让它漂移。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">地网（辐射瓣）的作用</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          λ/4 单极子只有半根振子，另外"半根"靠地面/地网以镜像方式补齐。馈电点在振子与地网之间，
          电流经地网流回馈点构成回路——没有地网，单极子几乎不辐射。地网根数越多、越长越接近理想无限地面；
          工程折衷是 4 根 λ/4、向下垂 45°：放平（0°）馈电阻抗约 36Ω，垂直上折趋于高阻，
          下垂 45° 恰好把阻抗抬到 50Ω 附近，与 50Ω 同轴馈线最搭。车载天线把车顶当地网，
          手持机用机壳当地网，都是"不完整地面"，谐振点与方向图会漂，更要靠实测修正。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">加感线圈：物理长度不够怎么办</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          27MHz 的 λ/4 有 2.6 米，车载和室内根本装不下。加感线圈（加载电感）用感抗补偿缺失的容抗，
          让"物理上短了一截"的导体在电长度上仍是 λ/4——谐振点落回目标频率。
          线圈放底部便于防水但效率略低，放顶部（顶加载）辐射效率更好但机械脆弱；
          螺旋弹簧绕法是把整根导线绕密，等效于分布加感。代价：加感天线 Q 值高、
          <span class="text-foreground font-medium">带宽明显变窄</span>，频率稍偏 SWR 就涨，且线圈损耗直接吃掉辐射效率，
          所以加感量越小越好——能装全尺寸就别加感。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">天线调谐顺序：先长度后匹配</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          正确顺序是两步：<span class="text-foreground font-medium">第一步"剪到谐振"</span>——修长度让 SWR 谷点
          （此时电抗 X≈0）落在目标频率上，这一步只调长度；<span class="text-foreground font-medium">第二步"匹配阻抗"</span>——
          谷点频率对了但 SWR 仍不为 1（阻抗不等于 50Ω），再用巴伦、匹配网络、γ 匹配或加粗/加长地网改电阻分量。
          顺序反了会陷入"调了匹配频率跑了、调了长度匹配又乱"的循环。每修一次长度都重测 SWR，
          用 <NuxtLink to="/tools/swr-calculator" class="text-primary hover:underline">驻波比换算</NuxtLink>
          把读数换算成反射系数与失配损耗，量化"这次修剪有没有进步"。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">433MHz 的 λ/4 天线到底多长？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              自由空间 λ = 300/433 ≈ 0.6928m，乘 0.25×0.95（裸铜线 VF）≈ 16.45cm。
              带皮线（VF 0.93）约 16.11cm，伸缩鞭（VF 0.97）约 16.80cm。
              剪线留到 17cm 附近实测，SWR 谷点频率偏高就一点点修短——433MHz 对长度很敏感，1mm 都看得出来。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">偶极子的两臂必须一样长吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              谐振频率主要由总长决定，两臂等长时馈点平衡、方向图对称。短波架设受环境限制时允许轻微不等长
              （馈点略偏离中心），影响的是方向图与馈线辐射，谐振点基本不变。本工具按"总长 = 两臂各半长"对称给出。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么算出来的天线实测 SWR 不是 1？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              三个常见原因：VF 估计不准（谷点频率偏移，修长度解决）；阻抗不是 50Ω（λ/4 单极子放平地网约 36Ω、
              偶极子约 73Ω，谷点频率上 SWR 仍有读数，加 45° 下垂地网或匹配网络解决）；
              以及安装环境（金属、地面高度、馈线共模电流）改变了有效 VF 与阻抗。先修长度、再处理环境、最后做匹配。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">加感线圈放在天线哪个位置好？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              底部加感加工方便、机械可靠、防水容易，是成品"弹簧天线"和车载鞭的常见做法；
              顶部/中部加载的辐射电流分布更接近全尺寸天线，效率更好但结构脆弱。
              同样的缩短量，加感位置越靠顶端需要的电感越小、效率越高。无论哪种，加感都收窄带宽，
              装好后仍要按"先谐振后匹配"的顺序实测微调。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'antenna-length'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Send, Calculator, Table, Waves, Info, CheckCircle, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// 各模式的结构系数：λ/4 单极子 0.25、λ/2 偶极子 0.5、5/8λ GP 0.625
const MODE_COEF = {
  'gp-quarter': 0.25,
  'dipole': 0.5,
  'gp-five-eighth': 0.625
}

// 自由空间波长（米）：λ = 300 / f(MHz)
function wavelengthM(fMHz) {
  if (!Number.isFinite(fMHz) || !(fMHz > 0)) return null
  return 300 / fMHz
}

// 天线物理长度（米）：系数 × λ × VF
function antennaLengthM(mode, fMHz, vf) {
  if (!Number.isFinite(fMHz) || !(fMHz > 0)) return null
  if (!Number.isFinite(vf) || !(vf > 0.5) || vf > 1) return null
  const coef = MODE_COEF[mode]
  if (!coef) return null
  return coef * (300 / fMHz) * vf
}

// 地网每根长度（米）：λ/4 × VF
function radialLengthM(fMHz, vf) {
  if (!Number.isFinite(fMHz) || !(fMHz > 0)) return null
  if (!Number.isFinite(vf) || !(vf > 0.5) || vf > 1) return null
  return 0.25 * (300 / fMHz) * vf
}

// 偶极子每臂半长（米）：总长 / 2
function dipoleArmM(totalM) {
  if (!Number.isFinite(totalM) || !(totalM > 0)) return null
  return totalM / 2
}

// 米 → 厘米
function mToCm(m) {
  if (!Number.isFinite(m)) return null
  return m * 100
}

// 常用频段速查：按当前 VF 生成 λ/4、λ/2、5/8λ 三列（厘米）
function quickLengthTable(freqList, vf) {
  if (!Number.isFinite(vf) || !(vf > 0.5) || vf > 1 || !Array.isArray(freqList)) return []
  return freqList.map(f => {
    const w = wavelengthM(f)
    if (w === null) return { freq: f, waveCm: NaN, quarterCm: NaN, halfCm: NaN, fiveEighthCm: NaN }
    return {
      freq: f,
      waveCm: mToCm(w),
      quarterCm: mToCm(antennaLengthM('gp-quarter', f, vf)),
      halfCm: mToCm(antennaLengthM('dipole', f, vf)),
      fiveEighthCm: mToCm(antennaLengthM('gp-five-eighth', f, vf))
    }
  })
}
// ==== PURE-FNS-END ====

// SEO
useSeoMeta({
  title: '天线长度计算器 - λ/4 单极子、λ/2 偶极子与速度因子修正',
  description: '在线天线长度计算器：按 λ=300/f 计算自由空间波长，λ/4 单极子、λ/2 偶极子与 5/8λ GP 三种模式，速度因子 VF（裸铜线/PVC 皮线/同轴振子/伸缩鞭）修正，地网与加感线圈建议，纯本地计算。',
  keywords: '天线长度计算, 四分之一波长, 偶极子天线, 速度因子, 地网, 加感线圈, 天线制作, antenna length calculator',
  author: '有条工具',
  ogTitle: '天线长度计算器 - λ/4、λ/2 与速度因子修正 | 有条工具',
  ogDescription: '单极子/偶极子/5/8λ 天线长度、VF 修正、地网与加感缩短方案。',
  ogUrl: 'https://www.util.cn/tools/antenna-length',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '天线长度计算器',
  twitterDescription: '单极子/偶极子/5/8λ 天线长度与速度因子修正。'
})

// JSON-LD 结构化数据（SoftwareApplication + FAQPage + BreadcrumbList）
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: '天线长度计算器',
          url: 'https://www.util.cn/tools/antenna-length',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'λ/4 单极子（GP）、λ/2 偶极子（DP）、5/8λ GP 三种模式',
            '自由空间波长 λ = 300/f(MHz)',
            '速度因子 VF 预设（裸铜线 0.95 / PVC 皮线 0.93 / 同轴振子 0.88 / 伸缩鞭 0.97）',
            '偶极子总长与两臂各半长',
            '单极子鞭长与 4 根 λ/4 下垂 45° 地网建议',
            '5/8λ 匹配线圈与加感缩短注记',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn' },
            { '@type': 'ListItem', position: 2, name: '工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: '天线长度计算器', item: 'https://www.util.cn/tools/antenna-length' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '433MHz 的 λ/4 天线到底多长？',
              acceptedAnswer: { '@type': 'Answer', text: 'λ = 300/433 ≈ 0.6928m，乘 0.25×0.95 ≈ 16.45cm；带皮线约 16.11cm，伸缩鞭约 16.80cm。剪线留余、实测 SWR 谷点后逐步修短。' }
            },
            {
              '@type': 'Question',
              name: '为什么要乘速度因子 VF？',
              acceptedAnswer: { '@type': 'Answer', text: '波在导体与介质中速度低于真空，加上导线末端效应，恰好谐振的物理长度比自由空间波长分数略短；VF 是两者的合并修正，裸铜线约 0.95，以实测 SWR 最低为准微调。' }
            },
            {
              '@type': 'Question',
              name: '地网的作用是什么？',
              acceptedAnswer: { '@type': 'Answer', text: '单极子只有半根振子，地网以镜像方式补齐另一半并提供馈电回路；4 根 λ/4 下垂 45° 可把馈电阻抗从约 36Ω 抬到接近 50Ω，与同轴馈线匹配更好。' }
            },
            {
              '@type': 'Question',
              name: '天线太长装不下怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '用加感线圈或螺旋绕法补足电长度：物理变短、电长度仍是 λ/4；代价是带宽变窄、效率略降，加感量越小越好，装好后按先谐振后匹配的顺序微调。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'antenna-length'
const SETTINGS_KEY = 'antenna-length-settings'
onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})

// ---------- 常量 ----------
const FREQ_PRESETS = [
  { label: '27M CB', v: 27 },
  { label: 'FM 收音 98M', v: 98 },
  { label: '145M', v: 145 },
  { label: '433M', v: 433 },
  { label: '868M', v: 868 },
  { label: '915M', v: 915 }
]
const VF_PRESETS = [
  { label: '裸铜线', v: 0.95 },
  { label: 'PVC 皮线', v: 0.93 },
  { label: '同轴振子', v: 0.88 },
  { label: '伸缩鞭', v: 0.97 }
]
const QUICK_FREQS = [27, 98, 145, 433, 868, 915]

// ---------- 状态 ----------
const mode = ref('gp-quarter')   // 'gp-quarter' | 'dipole' | 'gp-five-eighth'
const freqMhz = ref(433)
const vf = ref(0.95)
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 格式化 ----------
const fmt = (v, d = 2) => (Number.isFinite(v) ? String(parseFloat(v.toFixed(d))) : '—')

// ---------- 主计算 ----------
const result = computed(() => {
  const length = antennaLengthM(mode.value, freqMhz.value, vf.value)
  if (length === null) return null
  const wave = wavelengthM(freqMhz.value)
  const radial = radialLengthM(freqMhz.value, vf.value)
  return {
    lengthM: length,
    lengthCm: mToCm(length),
    waveM: wave,
    waveCm: mToCm(wave),
    armM: mode.value === 'dipole' ? dipoleArmM(length) : null,
    armCm: mode.value === 'dipole' ? mToCm(dipoleArmM(length)) : null,
    radialM: radial,
    radialCm: mToCm(radial)
  }
})

// ---------- 常用频段速查表 ----------
const quickTable = computed(() => quickLengthTable(QUICK_FREQS, vf.value))

// ---------- 设置持久化（localStorage，键前缀用工具 id） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (s.mode === 'gp-quarter' || s.mode === 'dipole' || s.mode === 'gp-five-eighth') mode.value = s.mode
    if (Number.isFinite(s.freqMhz) && s.freqMhz > 0) freqMhz.value = s.freqMhz
    if (Number.isFinite(s.vf) && s.vf > 0.5 && s.vf <= 1) vf.value = s.vf
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([mode, freqMhz, vf], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      mode: mode.value,
      freqMhz: freqMhz.value,
      vf: vf.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})
</script>
