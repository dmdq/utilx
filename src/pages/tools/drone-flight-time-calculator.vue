<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Plane class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">无人机续航计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">电池容量 × 电压 → 能量，按悬停 / 巡航功率与放电安全余量估算可用飞行时间，含风阻与低温惩罚提示</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        无人机续航估算工具：输入电池容量（mAh）与节数（2S/3S/4S/6S 预设或自定电压）得到电池能量（Wh），
        结合悬停功率（内置 DJI Mini / Mavic Air / Air 3 / Mavic 3 常见机型参考值，来自官方悬停时间与电池能量反推并与社区实测交叉）
        与巡航功率系数（默认悬停 ×0.7，对应巡航比悬停省电约 30% 的经验区间），按 LiPo 放电安全余量（默认保留 20%）计算可用时间；
        提供 5m/s 风速惩罚档（×0.85）与低温（＜5℃ 再 ×0.7）警告提示，可选填重量给出功率重量比参考。
        理论值与实测的差距原因（风 / 温度 / 电池老化）见下方说明。全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <BatteryCharging class="w-5 h-5 mr-2 text-primary" /> 飞行参数
        </h2>

        <!-- 电池 -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-muted-foreground mb-1">电池容量（mAh）</label>
            <input v-model.number="capacityMah" type="number" min="0" step="100" :class="SEL_CLS" placeholder="3000" />
          </div>
          <div>
            <label class="block text-xs text-muted-foreground mb-1">电池类型</label>
            <select v-model="reservePct" :class="SEL_CLS">
              <option :value="20">LiPo（保留 20% 安全余量，推荐）</option>
              <option :value="30">保守飞行（保留 30%）</option>
              <option :value="15">激进飞行（保留 15%）</option>
              <option :value="10">极限压榨（保留 10%，伤电池）</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs text-muted-foreground mb-1">电池节数 / 标称电压</label>
          <div class="grid grid-cols-5 gap-2">
            <button
              v-for="p in S_PRESETS"
              :key="p.label"
              type="button"
              @click="applySPreset(p)"
              class="px-1 py-2 rounded-lg border text-xs font-medium transition"
              :class="voltage === p.voltage ? BTN_ON : BTN_OFF"
            >
              {{ p.label }}
            </button>
          </div>
          <input v-model.number="voltage" type="number" min="1" step="0.1" :class="SEL_CLS + ' mt-2'" placeholder="标称电压 V（可自定）" />
        </div>

        <!-- 功率 -->
        <div>
          <label class="block text-xs text-muted-foreground mb-1">悬停功率（W，按机型预设或自定）</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="m in MODEL_PRESETS"
              :key="m.name"
              type="button"
              @click="applyModel(m)"
              class="px-2 py-2 rounded-lg border text-xs font-medium transition text-left"
              :class="hoverW === m.hoverW ? BTN_ON : BTN_OFF"
            >
              {{ m.name }}
              <span class="block text-[10px] text-muted-foreground font-normal">≈{{ m.hoverW }}W · 参考重量 {{ m.weightG }}g</span>
            </button>
          </div>
          <input v-model.number="hoverW" type="number" min="0" step="5" :class="SEL_CLS + ' mt-2'" placeholder="悬停功率 W（自定）" />
          <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            悬停功率非官方公开参数：预设值按「官方最长悬停时间 × 电池能量」反推均值（如 Mavic 3：77Wh / 40min ≈ 115W），
            并与社区功率实测（MavicPilots 功耗-载荷实测帖）交叉校核；同样适用于自装机按实测功率填写。
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-muted-foreground mb-1">巡航功率系数（悬停 × 系数）</label>
            <input v-model.number="cruiseCoef" type="number" min="0.3" max="1.2" step="0.05" :class="SEL_CLS" placeholder="0.7" />
            <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              平飞巡航利用平移升力，功率一般比悬停低 20%-40%，默认 ×0.7（低 30%）为常见经验取值；高速冲刺或逆风会高于悬停。
            </p>
          </div>
          <div>
            <label class="block text-xs text-muted-foreground mb-1">起飞重量（g，可选）</label>
            <input v-model.number="weightG" type="number" min="0" step="10" :class="SEL_CLS" placeholder="如 570" />
            <p v-if="powerRatioText" class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              {{ powerRatioText }}
            </p>
          </div>
        </div>

        <!-- 环境档 -->
        <div class="border-t border-border pt-4 space-y-2">
          <p class="text-sm font-medium text-foreground">环境惩罚档</p>
          <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input v-model="windy" type="checkbox" class="accent-primary w-4 h-4" />
            5m/s 以上风速（可用时间 ×0.85 经验系数）
          </label>
          <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input v-model="cold" type="checkbox" class="accent-primary w-4 h-4" />
            低温环境 ＜5℃（再 ×0.7，并触发低温警告）
          </label>
        </div>
      </div>

      <!-- 结果区 -->
      <div class="space-y-4">
        <div class="bg-muted/50 rounded-xl p-4">
          <div class="grid grid-cols-2 gap-3 text-sm mb-3">
            <div class="bg-background border border-border rounded-lg p-3">
              <p class="text-xs text-muted-foreground">电池能量</p>
              <p class="text-lg font-semibold text-foreground">{{ fmt1(result.wh) }} Wh</p>
            </div>
            <div class="bg-background border border-border rounded-lg p-3">
              <p class="text-xs text-muted-foreground">巡航功率（{{ fmt2(cruiseCoef) }}× 悬停）</p>
              <p class="text-lg font-semibold text-foreground">{{ fmt1(result.cruiseW) }} W</p>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-xs border-collapse">
              <thead>
                <tr class="text-muted-foreground border-b border-border">
                  <th class="px-2 py-1.5 text-left">工况</th>
                  <th class="px-2 py-1.5 text-right">理论满电时间</th>
                  <th class="px-2 py-1.5 text-right">可用（留 {{ reservePct }}%）</th>
                  <th class="px-2 py-1.5 text-right">当前环境可用</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-border/60">
                  <td class="px-2 py-2 font-medium text-foreground">悬停 {{ fmt1(result.hoverW) }}W</td>
                  <td class="px-2 py-2 text-right tabular-nums">{{ result.hoverFull }}</td>
                  <td class="px-2 py-2 text-right tabular-nums">{{ result.hoverUsable }}</td>
                  <td class="px-2 py-2 text-right tabular-nums text-primary font-semibold">{{ result.hoverEnv }}</td>
                </tr>
                <tr>
                  <td class="px-2 py-2 font-medium text-foreground">巡航 {{ fmt1(result.cruiseW) }}W</td>
                  <td class="px-2 py-2 text-right tabular-nums">{{ result.cruiseFull }}</td>
                  <td class="px-2 py-2 text-right tabular-nums">{{ result.cruiseUsable }}</td>
                  <td class="px-2 py-2 text-right tabular-nums text-primary font-semibold">{{ result.cruiseEnv }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
            计算式：能量 Wh = 容量 Ah × 电压 V；理论时间 = Wh ÷ 功率；可用时间 = 理论 ×（1 − 余量）× 风（如有 ×0.85）× 低温（如有 ×0.7）。
            「当前环境可用」已叠加你在左侧勾选的风速 / 低温档。
          </p>
        </div>

        <!-- 续航警告卡 -->
        <div class="bg-amber-500/10 border border-amber-500/40 rounded-xl p-4 space-y-2">
          <h3 class="font-semibold text-amber-700 flex items-center gap-1.5 text-sm">
            <TriangleAlert class="w-4 h-4 shrink-0" /> 续航与安全提示
          </h3>
          <p class="text-xs text-amber-700 leading-relaxed">
            低电量返航：建议设为剩 {{ reservePct }}% 电量即返航（对应单节负载电压约 3.5-3.7V）；
            LiPo 过放（低于 3.0V/节）会永久损伤容量与内阻。<template v-if="cold">低温（＜5℃）会使 LiPo 可用容量再缩水约 30%（×0.7），起飞前把电池贴身保温至 15℃ 以上再飞。</template>
            <template v-if="windy">5m/s 以上抗风飞行额外增加功耗，本页按 ×0.85 经验系数折算，阵风环境请再留 20% 以上余量。</template>
          </p>
        </div>

        <div class="bg-card border border-border rounded-lg p-4">
          <h3 class="font-semibold text-foreground mb-2 text-sm">同款电池不同功率下的可用悬停时间（留 {{ reservePct }}%）</h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div v-for="row in comparisonRows" :key="row.w" class="bg-muted/50 rounded-lg p-2 text-center">
              <p class="text-muted-foreground">{{ row.w }}W</p>
              <p class="font-semibold text-foreground tabular-nums">{{ row.min }}</p>
            </div>
          </div>
          <p class="text-xs text-muted-foreground mt-2">换更大 / 更小功率机型（或改变负载）时悬停可用时间的大致变化，按当前电池能量计算。</p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（details/summary 折叠） -->
    <details class="group bg-card border border-border rounded-lg mb-12">
      <summary class="cursor-pointer select-none px-6 py-4 text-lg font-semibold text-foreground flex items-center justify-between">
        <span><span class="text-primary mr-2">#</span>为什么实测续航总是短于理论？公式与来源</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div class="px-6 pb-6">
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          续航的理论骨架是能量守恒：<strong>电池能量（Wh）= 容量（Ah）× 标称电压（V）</strong>，例如 3000mAh 的 4S（14.8V）电池 = 3 × 14.8 = 44.4Wh；
          <strong>理论时间（h）= 电池能量 ÷ 平均功率（W）</strong>——3000mAh 4S 悬停功率 100W 时即 44.4 ÷ 100 = 0.444h ≈ 26.6 分钟。
          但实测总比理论短，原因按影响从大到小：① <strong>放电安全余量</strong>——LiPo 不能用到 0%，落地保留 20%（单节负载电压约 3.5-3.7V）是通行安全做法，
          直接砍掉 1/5 时间；② <strong>风</strong>——5m/s 以上抗风修正姿态与悬停位置，功耗上升，经验上按 ×0.85 折算，阵风更大；
          ③ <strong>温度</strong>——低温下 LiPo 化学活性下降，＜5℃ 可用容量再缩水约 30%（×0.7），起飞前保温电池非常有效；
          ④ <strong>电池老化</strong>——循环次数增加后实际容量低于标称（80% 健康度的电池只有标称 80% 的能量）；
          ⑤ 工况切换（爬升 / 急停 / 逆风冲刺瞬时功率可达悬停 2 倍以上）与标称容量的测试口径差异。
          本页把 ①②③ 做成可选档位让你看到各自的代价，④⑤ 则需要结合电池健康度自行打折。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">巡航为什么比悬停省电？</h3>
        <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
          多旋翼前飞时机身把「新空气」送进桨盘（平移升力效应），桨的诱导功率下降，中等速度平飞的功率通常比悬停<strong>低 20%-40%</strong>
          （社区实测约低 20%，速度过快后阻力又把功耗拉回去），本页默认取 ×0.7（低 30%）为巡航系数；这也是厂商「最长飞行时间」普遍按 25% 左右巡航速度标注、
          而「最长悬停时间」略短的原因。爬升最费电（约比悬停高 20%+），规划航线多用平飞、少悬停，续航可以明显延长。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">悬停功率预设值的口径与来源</h3>
        <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
          无人机厂商一般不公布悬停功率（W）。本页预设值按「官方最长悬停时间 × 官方电池能量」反推均值：
          DJI Mini 2（17.3Wh / 31min ≈ 35W）、DJI Mavic Air 2（40.4Wh / 34min ≈ 75W，社区实测悬停约 70-100W 区间一致）、
          DJI Air 3（62.6Wh / 42min ≈ 90W）、DJI Mavic 3（77Wh / 40min ≈ 115W）；并在可选重量中给出对应参考起飞重量用于功率重量比对照。
          两源交叉：官方规格页（电池能量、悬停时间）与社区实测（MavicPilots 功耗-载荷实测帖）口径一致后取均值，
          属估算口径而非官方参数；自装机请以功率计实测为准。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">电池健康度怎么估计？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          把同一块电池充满后飞到剩 20%，记录悬停时间，与新电池同工况对比：实测 ÷ 标称 ≈ 电池健康度（SoH）。
          也可以在支持电池循环数据的 App（如 DJI）里看循环次数与「电池严重度」。健康度低于 80% 建议降额使用并计划更换；
          长期满电存放、深放、高温存放都会加速老化——长期存放保持 50%-60% 电量更耐用。充电时长可配合站内
          <a href="/tools/lithium-charge-time/" class="text-primary underline">锂电池充电时间计算器</a>估算（CC-CV 分段口径）。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">3000mAh 4S 电池悬停能用多久？</h3>
            <p class="text-sm text-muted-foreground mt-1">电池能量 = 3Ah × 14.8V = 44.4Wh。悬停 100W 时理论 26.6 分钟，按通行安全余量留 20% 后约 21.3 分钟；巡航功率 70W 时理论 38.1 分钟、可用约 30.4 分钟。风与低温还要再打折。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么说明书上的续航我飞不出来？</h3>
            <p class="text-sm text-muted-foreground mt-1">厂商续航是无风、恒温、按经济巡航速度从满电飞到系统强制落地的实验室值；实际飞行有安全余量设置、风、温度、老化与机动功耗。本页把余量、风、低温三档拆开，可以逐项看出自己差在哪。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">功率重量比多少算正常？</h3>
            <p class="text-sm text-muted-foreground mt-1">常见航拍多旋翼悬停功率重量比约 0.10-0.15 W/g（如 Mavic Air 2：约 75W / 570g ≈ 0.13）。填入重量后本页会给出对照：明显偏高常见于加装负载或重载机型，偏低则可能输入有误或气动效率特别高。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">充电要用多久？</h3>
            <p class="text-sm text-muted-foreground mt-1">充电按 CC-CV 曲线分恒流与恒压两段，0-80% 快、尾段慢。可配合站内<a href="/tools/lithium-charge-time/" class="text-primary underline">锂电池充电时间计算器</a>按容量、充电器功率与倍率估算。</p>
          </div>
        </div>
      </div>
    </details>

    <div class="no-print">
      <RelatedTools :currentToolId="'drone-flight-time-calculator'" :category="'calculate'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Plane, BatteryCharging, TriangleAlert, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '无人机续航计算器 - 悬停/巡航飞行时间估算（风阻低温惩罚+安全余量）',
  description: '免费在线无人机续航计算器：电池容量×电压得 Wh 能量，按悬停功率（DJI Mini/Mavic Air/Air 3/Mavic 3 预设或自定）与巡航系数估算理论满电与可用时间，LiPo 放电安全余量默认 20%，含 5m/s 风速 ×0.85 与低温 ×0.7 惩罚档、功率重量比参考与电池健康度说明',
  keywords: '无人机续航计算,飞行时间计算,悬停功率,电池续航,LiPo安全余量,抗风功耗,DJI Mini,Mavic 续航',
  author: '有条工具',
  ogTitle: '无人机续航计算器 - 悬停/巡航时间估算 | 有条工具',
  ogDescription: 'Wh 能量 + 悬停/巡航功率 + 安全余量 + 风速低温惩罚，四档时间一目了然，功率重量比参考。',
  ogUrl: 'https://www.util.cn/tools/drone-flight-time-calculator',
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
          name: '无人机续航计算器',
          url: 'https://www.util.cn/tools/drone-flight-time-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '电池能量 Wh = 容量 Ah × 电压（2S/3S/4S/6S 预设 + 自定）',
            '悬停功率机型预设（官方悬停时间反推 + 社区实测交叉）',
            '巡航功率系数（悬停 ×0.7 默认，平移升力经验区间 20%-40%）',
            'LiPo 放电安全余量默认保留 20%',
            '5m/s 风 ×0.85 与低温 ×0.7 惩罚档与警告卡',
            '功率重量比参考与电池健康度说明'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '无人机续航计算器', item: 'https://www.util.cn/tools/drone-flight-time-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '3000mAh 4S 电池悬停能用多久？',
              acceptedAnswer: { '@type': 'Answer', text: '电池能量 = 3Ah × 14.8V = 44.4Wh。悬停 100W 时理论 26.6 分钟，保留 20% 安全余量后约 21.3 分钟；巡航 70W 时理论 38.1 分钟、可用约 30.4 分钟。' }
            },
            {
              '@type': 'Question',
              name: '为什么实测续航总是短于理论？',
              acceptedAnswer: { '@type': 'Answer', text: '主要因为放电安全余量（LiPo 建议剩 20% 落地）、风阻（5m/s 以上约 ×0.85）、低温（＜5℃ 约 ×0.7）、电池老化（容量低于标称）与机动瞬时功耗，理论值是满能量全用完的理想上限。' }
            },
            {
              '@type': 'Question',
              name: '巡航为什么比悬停省电？',
              acceptedAnswer: { '@type': 'Answer', text: '前飞带来平移升力，桨的诱导功率下降，中等速度平飞功率通常比悬停低 20%-40%，本页默认取悬停 ×0.7。爬升最费电，航线多用平飞少悬停可延长续航。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------

// 节数预设：标称电压（LiPo 每节 3.7V 标称）
const S_PRESETS = [
  { label: '2S 7.4V', voltage: 7.4 },
  { label: '3S 11.1V', voltage: 11.1 },
  { label: '4S 14.8V', voltage: 14.8 },
  { label: '6S 22.2V', voltage: 22.2 }
]

// 常见机型悬停功率预设：按官方最长悬停时间 × 电池能量反推均值，并与社区实测交叉校核
const MODEL_PRESETS = [
  { name: 'DJI Mini 系列', hoverW: 35, weightG: 249, note: 'Mini 2：17.3Wh/31min≈33.5W' },
  { name: 'DJI Mavic Air 2', hoverW: 75, weightG: 570, note: '40.4Wh/34min≈71W，实测 70-100W' },
  { name: 'DJI Air 3', hoverW: 90, weightG: 720, note: '62.6Wh/42min≈89W' },
  { name: 'DJI Mavic 3', hoverW: 115, weightG: 895, note: '77Wh/40min≈115W' }
]

// 金额/数值 0.01 定点
function round2(v) {
  const x = Number(v)
  if (!Number.isFinite(x)) return 0
  return Math.round((x + Number.EPSILON) * 100) / 100
}
function round1(v) {
  const x = Number(v)
  if (!Number.isFinite(x)) return 0
  return Math.round((x + Number.EPSILON) * 10) / 10
}
function fmt1(v) {
  return round1(v).toLocaleString('zh-CN', { maximumFractionDigits: 1 })
}
function fmt2(v) {
  return round2(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// 分钟格式化：<60 → x.x 分钟；≥60 → x 小时 y 分钟
function fmtMin(min) {
  const m = Math.max(0, Number(min) || 0)
  if (m < 60) return fmt1(m) + ' 分钟'
  const h = Math.floor(m / 60)
  const rest = round1(m - h * 60)
  return h + ' 小时 ' + (rest === 0 ? '0' : fmt1(rest)) + ' 分钟'
}

// 核心计算：输入全部先做数值保护，输出 { wh, hoverW, cruiseW, 各档分钟文本 }
function calcFlightTime(input) {
  const p = input && typeof input === 'object' ? input : {}
  const capacityAh = Math.max(0, Number(p.capacityMah) || 0) / 1000
  const voltage = Math.max(0, Number(p.voltage) || 0)
  const hoverW = Math.max(0, Number(p.hoverW) || 0)
  const coefRaw = Number(p.cruiseCoef)
  const coef = Number.isFinite(coefRaw) && coefRaw > 0 ? coefRaw : 0.7
  const reserve = Math.min(0.9, Math.max(0, (Number(p.reservePct) || 0) / 100))
  const wind = !!p.wind
  const cold = !!p.cold

  const wh = capacityAh * voltage
  const cruiseW = hoverW * coef
  const fullMin = (w) => (w > 0 ? (wh / w) * 60 : 0)
  const envFactor = (1 - reserve) * (wind ? 0.85 : 1) * (cold ? 0.7 : 1)

  return {
    wh: round2(wh),
    hoverW: round2(hoverW),
    cruiseW: round2(cruiseW),
    hoverFullMin: fullMin(hoverW),
    cruiseFullMin: fullMin(cruiseW),
    hoverUsableMin: fullMin(hoverW) * (1 - reserve),
    cruiseUsableMin: fullMin(cruiseW) * (1 - reserve),
    hoverEnvMin: fullMin(hoverW) * envFactor,
    cruiseEnvMin: fullMin(cruiseW) * envFactor,
    envFactor
  }
}

// 结果文本化（分钟 → 可读文本）
function describeResult(r) {
  if (!r) return null
  return {
    wh: r.wh,
    hoverW: r.hoverW,
    cruiseW: r.cruiseW,
    hoverFull: fmtMin(r.hoverFullMin),
    hoverUsable: fmtMin(r.hoverUsableMin),
    hoverEnv: fmtMin(r.hoverEnvMin),
    cruiseFull: fmtMin(r.cruiseFullMin),
    cruiseUsable: fmtMin(r.cruiseUsableMin),
    cruiseEnv: fmtMin(r.cruiseEnvMin)
  }
}

// 功率重量比（W/g）与参考判定：常见航拍多旋翼约 0.10-0.15 W/g
function powerWeightRatio(hoverW, weightG) {
  const w = Math.max(0, Number(hoverW) || 0)
  const g = Math.max(0, Number(weightG) || 0)
  if (w <= 0 || g <= 0) return null
  const ratio = w / g
  let verdict
  if (ratio > 0.15) verdict = '偏高：常见于加装负载 / 重载机型，或高动力余量的运动机型'
  else if (ratio < 0.1) verdict = '偏低：请核对功率与重量输入，或为特别注重效率的长航时构型'
  else verdict = '在常见航拍多旋翼区间（约 0.10-0.15 W/g）内'
  return { ratio, verdict }
}

// 同款电池不同功率对比（悬停可用，保留余量）
function comparisonOf(wh, reservePct, powers) {
  const factor = 1 - (Number(reservePct) || 0) / 100
  return (Array.isArray(powers) ? powers : []).map((w) => ({
    w,
    min: w > 0 ? fmtMin((wh / w) * 60 * factor) : '—'
  }))
}

// ---------- 页面状态与交互 ----------
const BTN_ON = 'bg-primary/10 border-primary/40 text-primary font-medium'
const BTN_OFF = 'bg-muted/40 border-border text-muted-foreground hover:bg-muted/70'
const SEL_CLS = 'w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring'

const capacityMah = ref(3000)
const voltage = ref(14.8)
const hoverW = ref(100)
const cruiseCoef = ref(0.7)
const reservePct = ref(20)
const weightG = ref(0)
const windy = ref(false)
const cold = ref(false)

function applySPreset(p) {
  voltage.value = p.voltage
}

function applyModel(m) {
  hoverW.value = m.hoverW
  if (!weightG.value) weightG.value = m.weightG
}

const result = computed(() => {
  const r = calcFlightTime({
    capacityMah: capacityMah.value,
    voltage: voltage.value,
    hoverW: hoverW.value,
    cruiseCoef: cruiseCoef.value,
    reservePct: reservePct.value,
    wind: windy.value,
    cold: cold.value
  })
  return describeResult(r) || { wh: 0, hoverW: 0, cruiseW: 0, hoverFull: '—', hoverUsable: '—', hoverEnv: '—', cruiseFull: '—', cruiseUsable: '—', cruiseEnv: '—' }
})

const resultRaw = computed(() => calcFlightTime({
  capacityMah: capacityMah.value,
  voltage: voltage.value,
  hoverW: hoverW.value,
  cruiseCoef: cruiseCoef.value,
  reservePct: reservePct.value,
  wind: windy.value,
  cold: cold.value
}))

const powerRatioText = computed(() => {
  const p = powerWeightRatio(hoverW.value, weightG.value)
  return p ? '悬停功率重量比 ≈ ' + fmt2(p.ratio) + ' W/g，' + p.verdict : ''
})

const comparisonRows = computed(() => comparisonOf(resultRaw.value.wh, reservePct.value, [30, 60, 100, 150]))

onMounted(() => {
  addRecentTool('drone-flight-time-calculator')
})
</script>
