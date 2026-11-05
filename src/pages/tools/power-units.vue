<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Activity class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">功率单位换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">W / kW / hp / PS / BTU/h / ft·lb/s 六单位联动互转，1 kW ≈ 1.341 hp ≈ 1.360 PS，空调「匹」口径警示与电机铭牌注记</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线功率单位换算工具：以瓦特（W，SI）为基准的精确系数（1 hp 机械马力 = 745.6999 W、1 PS 公制马力 = 735.4988 W、1 BTU/h = 0.29307 W、1 ft·lb/s = 1.355818 W），
        在瓦、千瓦、机械马力、公制马力、英热单位每小时、英尺磅力每秒六个功率单位之间实时互转，任一单位输入、其余五个联动更新；
        附空调匹数、家用轿车、电机铭牌、电吹风、骑行功率等 8 条场景参考功率（点行即载入换算）、kW↔PS 与 hp↔kW 常用速换卡，以及「空调匹数 → 制冷量/电功率」对照卡。
        空调「1 匹 ≈ 735 W」说的是电功率口径，与制冷量的「匹」极易混淆，警示见下。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 输入卡 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Gauge class="w-5 h-5 mr-2 text-primary" /> 输入功率
        </h2>

        <div class="grid grid-cols-3 gap-1.5">
          <button
            v-for="u in UNITS"
            :key="u.id"
            @click="inputUnit = u.id"
            class="px-1 py-2 rounded-lg border text-[11px] font-semibold transition"
            :class="inputUnit === u.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/40'"
            :title="u.name"
          >
            {{ u.symbol }}
          </button>
        </div>

        <div>
          <input
            v-model="inputValue"
            type="number"
            min="0"
            step="any"
            placeholder="输入数值，如 1"
            class="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p class="text-[10px] text-muted-foreground mt-1.5 flex items-start gap-1.5">
            <TriangleAlert class="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>输入以当前所选单位计；hp 为美制机械马力，PS 为德制公制马力，两者相差约 1.4%。</span>
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            @click="applyPreset(1, 'kw')"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition"
          >
            <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 预设 1 kW
          </button>
          <button
            @click="applyPreset(735.5, 'W')"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition"
          >
            <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 预设 735.5 W（≈1 PS）
          </button>
          <button
            @click="resetInput"
            class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition"
          >
            <RefreshCw class="w-3 h-3 inline mr-1 -mt-0.5" /> 清空
          </button>
        </div>

        <!-- 常用速换卡 -->
        <div class="border-t border-border pt-4">
          <p class="text-sm font-medium text-foreground mb-2">常用速换（kW↔PS · hp↔kW，马力档）</p>
          <div class="grid grid-cols-2 gap-2 text-center">
            <div>
              <p class="text-[10px] text-muted-foreground mb-1.5">kW → PS</p>
              <div class="space-y-1">
                <button
                  v-for="q in quickKwPsTable"
                  :key="'k' + q.value"
                  @click="applyPreset(q.value, 'kw')"
                  class="w-full px-2 py-1 rounded-md bg-muted/40 border border-border text-[11px] font-mono text-foreground hover:border-primary/40 transition"
                >
                  {{ q.value }} = {{ q.converted }}
                </button>
              </div>
            </div>
            <div>
              <p class="text-[10px] text-muted-foreground mb-1.5">hp → kW</p>
              <div class="space-y-1">
                <button
                  v-for="q in quickHpKwTable"
                  :key="'h' + q.value"
                  @click="applyPreset(q.value, 'hp')"
                  class="w-full px-2 py-1 rounded-md bg-muted/40 border border-border text-[11px] font-mono text-foreground hover:border-primary/40 transition"
                >
                  {{ q.value }} = {{ q.converted }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 结果大表 + 空调匹数对照（占两列） -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold flex items-center">
              <Activity class="w-5 h-5 mr-2 text-primary" /> 六单位换算结果
            </h2>
            <button
              @click="copyResults"
              :disabled="!canCopy"
              class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <CheckCircle v-if="copied" class="w-3.5 h-3.5 text-green-500" />
              <Copy v-else class="w-3.5 h-3.5" />
              {{ copied ? '已复制' : '复制结果' }}
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div
              v-for="r in resultRows"
              :key="r.id"
              class="flex items-center justify-between px-4 py-3 rounded-lg border"
              :class="r.id === inputUnit ? 'bg-primary/10 border-primary/40' : 'bg-muted/40 border-border'"
            >
              <div>
                <p class="text-sm font-semibold text-foreground">{{ r.symbol }}
                  <span v-if="r.id === inputUnit" class="ml-1.5 text-[10px] font-normal text-primary">当前输入单位</span>
                </p>
                <p class="text-[11px] text-muted-foreground">{{ r.name }}（{{ r.systemLabel }}）</p>
              </div>
              <p class="text-2xl font-bold font-mono" :class="r.id === inputUnit ? 'text-primary' : 'text-foreground'">
                {{ r.value === null ? '—' : fmtPower(r.value) }}
              </p>
            </div>
          </div>

          <p class="text-xs text-muted-foreground mt-4 leading-relaxed">
            基准：1 W ≡ 1 W；1 hp（机械/电马力）= 550 ft·lb/s = 745.6998715822702 W（精确定义）；1 PS（公制马力）= 75 kgf·m/s = 735.49875 W（精确定义）；
            1 BTU/h = 1055.05585262 J / 3600 s = 0.29307107 W。锚点：1 kW ≈ 1.341 hp ≈ 1.360 PS；735.5 W ≈ 1 PS；1 hp = 550 ft·lb/s。
          </p>
        </div>

        <!-- 空调匹数对照卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Info class="w-5 h-5 mr-2 text-primary" /> 空调「匹」对照（电功率口径 ≠ 制冷量口径）
          </h2>
          <p class="text-xs text-muted-foreground mb-4">点行载入电功率估算值换算。制冷量才是选型依据，需要按面积精算请用本站<a href="/tools/ac-btu-calculator/" class="text-primary hover:underline">空调 BTU 计算器</a>。</p>

          <div class="overflow-x-auto mb-3">
            <div class="min-w-[420px]">
              <div class="grid grid-cols-[1fr_1fr_1fr] gap-2 px-3 py-2 text-[11px] font-medium text-muted-foreground border-b border-border">
                <span>匹数</span><span>制冷量（W）</span><span>电功率估算（W）</span>
              </div>
              <button
                v-for="row in acHorsepowerRows"
                :key="row.label"
                @click="applyPreset(row.powerW, 'W')"
                class="w-full grid grid-cols-[1fr_1fr_1fr] gap-2 px-3 py-2.5 text-left text-xs border-b border-border/60 hover:bg-primary/5 transition items-center"
              >
                <span class="font-medium text-foreground">{{ row.label }}</span>
                <span class="font-mono text-muted-foreground">{{ row.coolingW }}</span>
                <span class="font-mono text-primary">{{ row.powerW }}（≈{{ row.psText }} PS）</span>
              </button>
            </div>
          </div>

          <p class="text-xs leading-relaxed p-2.5 rounded bg-amber-500/10 text-foreground flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>「1 匹 ≈ 735 W」源自公制马力 1 PS = 735.49875 W，说的是压缩机电功率口径；而空调销售里「1 匹 = 2500 W 制冷量」是制冷量口径——两者相差 3 倍以上且量纲不同（输入电功率 vs 输出冷量）。看耗电用铭牌「输入功率/电流」，选空调面积看「制冷量/BTU/h」，别拿 735 W 当制冷量去套房间面积。</span>
          </p>
        </div>
      </div>
    </div>

    <!-- 页面说明条 -->
    <div class="bg-muted/40 border border-border rounded-lg px-4 py-3 mb-6 flex items-start gap-2">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        hp 与 PS 是两套马力定义：美制 hp = 550 ft·lb/s = 745.6999 W，德制 PS = 75 kgf·m/s = 735.4988 W，同一台发动机「150 hp」与「152 PS」是同一功率。汽车与电机铭牌以 kW 为法定口径，hp/PS 仅作参考；BTU/h 是暖通行业口径（1 BTU/h ≈ 0.293 W），与能量单位 BTU（1055 J）量纲不同。
      </p>
    </div>

    <!-- 场景参考表 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-lg font-semibold flex items-center mb-1">
        <Gauge class="w-5 h-5 mr-2 text-primary" /> 场景参考功率（点击行载入换算）
      </h2>
      <p class="text-xs text-muted-foreground mb-4">「≈ 换算」列由系数自动换算；电机/车辆实际功率因工况与效率而异，以铭牌与说明书为准。</p>

      <div class="overflow-x-auto">
        <div class="min-w-[640px]">
          <div class="grid grid-cols-[1.4fr_0.8fr_0.9fr_1.6fr] gap-2 px-3 py-2 text-[11px] font-medium text-muted-foreground border-b border-border">
            <span>场景</span><span>参考值</span><span>≈ 换算</span><span>说明</span>
          </div>
          <button
            v-for="row in scenarioRows"
            :key="row.name"
            @click="loadScenario(row)"
            class="w-full grid grid-cols-[1.4fr_0.8fr_0.9fr_1.6fr] gap-2 px-3 py-2.5 text-left text-xs border-b border-border/60 hover:bg-primary/5 transition items-center"
          >
            <span class="font-medium text-foreground">{{ row.name }}</span>
            <span class="font-mono text-foreground">{{ row.valueText }}</span>
            <span class="font-mono text-muted-foreground">{{ row.convertedText }}</span>
            <span class="text-muted-foreground leading-snug">{{ row.note }}</span>
          </button>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>W、hp、PS、BTU/h 都是什么单位？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          功率是单位时间做的功，SI 单位是瓦特（W）＝1 焦耳每秒。日常口语单位有三套：
          机械马力 hp（英美体系，1 hp = 550 ft·lb/s = 745.6999 W）；公制马力 PS（德语 Pferdestärke，1 PS = 75 kgf·m/s = 735.4988 W，日系车与国内口语「多少匹」源于此）；
          暖通行业的 BTU/h（1 BTU/h ≈ 0.293 W）。锚点：1 kW ≈ 1.341 hp ≈ 1.360 PS，1 PS 比 1 hp 小约 1.4%。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">hp 和 PS 有什么区别？为什么同一台车两个数字？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          两者都是「马力」，只是定义的「马」不同：英制按「一匹马拉动 550 磅每秒 1 英尺」定义，公制按「一匹马拉起 75 公斤每秒 1 米」定义，凑巧都是约 735-746 W 但不相等。
          同一台 100 kW 的发动机：150 hp = 152 PS，车厂按目标市场选口径展示——美国标 hp，德国日本标 PS，国内铭牌法定 kW。
          看进口车参数时先确认单位再对比，150 hp 与 150 PS 差约 2 hp，虽然不大但累计到排量税与保险口径时就容易吵架。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">空调「1 匹 ≈ 735 W」到底指什么？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          这是最容易踩坑的口径：1 PS = 735.49875 W，所以「1 匹空调」最初指压缩机输入电功率约 735 W 级别的机型；
          但国内销售习惯把「匹」对应到制冷量——1 匹 ≈ 2500 W 制冷量（约 8500 BTU/h），1.5 匹 ≈ 3500 W，2 匹 ≈ 5000 W。
          电功率与制冷量相差约 3 倍，靠能效比（COP ≈ 3）连接：制冷量 = 输入电功率 × COP。
          算耗电看输入功率（1.5 匹约 1.1 kW，一小时约 1 度电），选机型看制冷量是否覆盖房间负荷，两者不可互换。按面积精算请用本站的空调 BTU 计算器。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">电机铭牌上的 kW 与 hp 怎么对照？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          国产电机铭牌用 kW，美系设备常用 hp：7.5 kW ≈ 10 hp、11 kW ≈ 15 hp、15 kW ≈ 20 hp、55 kW ≈ 75 hp（按 1 hp = 0.7457 kW 折算）。
          选变频器/断路器时还要看额定电流与功率因数，不能只按功率折算；
          电机「额定功率」是连续输出上限，短时过载 1.5 倍属正常设计（S2/S3 工作制另计）。风机水泵类负载配电机时，实际工作点功率应落在额定值的 70%-100% 区间，长期低载效率差。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">1 kW 等于多少 hp、多少 PS？</h3>
            <p class="text-sm text-muted-foreground mt-1">1 kW ≈ 1.3410 hp ≈ 1.3596 PS。反过来 1 hp ≈ 0.7457 kW、1 PS ≈ 0.7355 kW。粗算口诀：kW 乘 1.36 得 PS，乘 1.34 得 hp。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">735.5 W 是 1 PS 吗？空调「匹」也是这个数吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">1 PS = 735.49875 W，所以 735.5 W ≈ 1.000002 PS，工程上就是 1 马力。空调「1 匹」借用了这个数指电功率档位，但销售口径的「1 匹 = 2500 W 制冷量」是另一回事，两者相差约 3 倍，注意区分。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">BTU/h 是功率还是能量？1 BTU/h 是多少 W？</h3>
            <p class="text-sm text-muted-foreground mt-1">BTU/h 是功率（1 BTU/h ≈ 0.29307 W，9000 BTU/h ≈ 2637 W），BTU 才是能量（1 BTU = 1055.06 J）。空调铭牌的「9000 BTU」按行业习惯省略了 /h，实际是制冷量功率口径。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">换算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有换算与空调匹数对照都在你的浏览器本地完成，不发送任何网络请求，输入数值不会被存储或上传。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'power-units'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  Activity, Gauge, CheckCircle, TriangleAlert, ChevronUp, ChevronDown,
  Info, RefreshCw, Play, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'power-units'

// ---------- SEO ----------
useSeoMeta({
  title: '功率单位换算 - 在线kW/hp/PS/BTU/h功率换算工具',
  description: '免费在线功率单位换算，W、kW、hp（机械马力）、PS（公制马力）、BTU/h、ft·lb/s 六单位双向精确互转，附空调匹数口径警示（1匹≈735W电功率）、电机铭牌对照与场景参考功率表，纯浏览器本地运行不上传',
  keywords: '功率换算,马力kw换算,hp ps区别,千瓦马力,BTU/h换算,匹数对照,电机功率',
  author: '有条工具',
  ogTitle: '功率单位换算 - 在线kW/hp/PS/BTU/h功率换算工具 | 有条工具',
  ogDescription: '六个功率单位精确互转，1kW≈1.341hp≈1.360PS，空调「匹」口径警示与电机铭牌注记，纯本地换算。',
  ogUrl: 'https://www.util.cn/tools/power-units',
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
          name: '功率单位换算器',
          url: 'https://www.util.cn/tools/power-units',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['W/kW/hp/PS/BTU/h/ft·lb/s 六单位双向互转', '精确定义系数（1 hp = 745.6998715822702 W、1 PS = 735.49875 W）', '1kW≈1.341hp≈1.360PS 锚点速查', '空调匹数→制冷量/电功率对照卡', '车辆/电机/家电 8 条场景参考功率', '结果一键复制', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '功率单位换算器', item: 'https://www.util.cn/tools/power-units/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '1 kW 等于多少 hp、多少 PS？',
              acceptedAnswer: { '@type': 'Answer', text: '1 kW ≈ 1.3410 hp ≈ 1.3596 PS。反过来 1 hp ≈ 0.7457 kW、1 PS ≈ 0.7355 kW。粗算口诀：kW 乘 1.36 得 PS，乘 1.34 得 hp。' }
            },
            {
              '@type': 'Question',
              name: '735.5 W 是 1 PS 吗？空调「匹」也是这个数吗？',
              acceptedAnswer: { '@type': 'Answer', text: '1 PS = 735.49875 W，735.5 W ≈ 1 PS。空调「1 匹」借用了这个数指电功率档位，但销售口径的「1 匹 = 2500 W 制冷量」是另一回事，两者相差约 3 倍。' }
            },
            {
              '@type': 'Question',
              name: 'BTU/h 是功率还是能量？1 BTU/h 是多少 W？',
              acceptedAnswer: { '@type': 'Answer', text: 'BTU/h 是功率（1 BTU/h ≈ 0.29307 W），BTU 才是能量（1 BTU = 1055.06 J）。空调铭牌的「9000 BTU」实际是 9000 BTU/h 制冷量功率口径。' }
            },
            {
              '@type': 'Question',
              name: '换算数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有换算与空调匹数对照都在浏览器本地完成，不发送任何网络请求，输入数值不会被存储或上传。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 换算系数以 W（瓦特）为基准：W_PER[unit] = 该单位 1 份对应多少 W
const W_PER = {
  W: 1,                  // 瓦特（SI）
  kw: 1000,              // 千瓦
  hp: 745.6998715822702, // 机械/电马力：550 ft·lb/s（精确定义）
  PS: 735.49875,         // 公制马力：75 kgf·m/s（精确定义，g₀=9.80665）
  btuh: 1055.05585262 / 3600, // 英热单位每小时（BTU IT 口径）≈ 0.29307107 W
  ftlbs: 1.3558179483316004   // 英尺磅力每秒（精确定义）
}

const UNITS = [
  { id: 'W', symbol: 'W', name: '瓦特', systemLabel: '国际单位制 SI' },
  { id: 'kw', symbol: 'kW', name: '千瓦', systemLabel: '国际单位制 SI·铭牌口径' },
  { id: 'hp', symbol: 'hp', name: '机械马力', systemLabel: '美制（550 ft·lb/s）' },
  { id: 'PS', symbol: 'PS', name: '公制马力', systemLabel: '德制·日系车（75 kgf·m/s）' },
  { id: 'btuh', symbol: 'BTU/h', name: '英热单位每小时', systemLabel: '暖通·空调' },
  { id: 'ftlbs', symbol: 'ft·lb/s', name: '英尺磅力每秒', systemLabel: '英制' }
]

function unitById(id) {
  return UNITS.find((u) => u.id === id) || null
}

// 浮点尾差清洗：按 12 位有效数字截断；若与更低有效位的舍入值仅差相对 1e-9 以内则吸附到整值，
// 使往返换算（如 bar→psi→bar）精确回到原值，同时不损失常规换算结果的精度
function cleanFloat(v, sig = 12) {
  if (!Number.isFinite(v)) return NaN
  if (v === 0) return 0
  for (const s of [6, 8, 10]) {
    const cand = Number(v.toPrecision(s))
    if (cand !== 0 && Math.abs(v - cand) / Math.abs(v) < 1e-9) return cand
  }
  return Number(v.toPrecision(sig))
}

// 任意单位 → W
function toW(value, unitId) {
  const k = W_PER[unitId]
  if (!Number.isFinite(value) || typeof k !== 'number') return NaN
  return cleanFloat(value * k)
}

// W → 任意单位
function fromW(w, unitId) {
  const k = W_PER[unitId]
  if (!Number.isFinite(w) || typeof k !== 'number') return NaN
  return cleanFloat(w / k)
}

// 通用换算：value 按 fromId 输入，结果按 toId 表达
function convertPower(value, fromId, toId) {
  return fromW(toW(value, fromId), toId)
}

// 输入解析：空串 / 非数字 / 负数一律视为无效
function parsePowerInput(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') return null
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : null
}

// 展示格式化：按量级自适应小数位
function fmtPower(v) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—'
  if (v === 0) return '0'
  const a = Math.abs(v)
  if (a < 0.0005) return v.toExponential(2)
  const d = a >= 1000 ? 1 : a >= 10 ? 2 : a >= 1 ? 3 : 4
  return v.toFixed(d)
}
// ---------- 纯逻辑结束 ----------

// ---------- 换算状态 ----------
const inputUnit = ref('kw')
const inputValue = ref('1')

const parsed = computed(() => parsePowerInput(inputValue.value))
const wValue = computed(() => (parsed.value === null ? null : toW(parsed.value, inputUnit.value)))
const resultRows = computed(() =>
  UNITS.map((u) => ({ ...u, value: wValue.value === null ? null : fromW(wValue.value, u.id) }))
)
const canCopy = computed(() => wValue.value !== null)

const copyText = computed(() => {
  if (wValue.value === null) return ''
  const unit = unitById(inputUnit.value)
  const lines = resultRows.value.map((r) => `${r.symbol}: ${fmtPower(r.value)}`)
  return [`输入: ${parsed.value} ${unit ? unit.symbol : ''}`, ...lines].join('\n')
})

function applyPreset(value, unitId) {
  inputUnit.value = unitId
  inputValue.value = String(value)
}

function resetInput() {
  inputValue.value = ''
  copied.value = false
}

// ---------- 静态表（纯常量派生，无浏览器 API） ----------
const scenarioRows = [
  { name: '空调 1 匹（电功率口径）', v: 735, unit: 'W', show: 'PS', note: '≈ 1 PS；销售口径的 1 匹是 2500 W 制冷量，勿混淆' },
  { name: '空调 1.5 匹运行功率', v: 1100, unit: 'W', show: 'btuh', note: '制冷 3500 W 档，压缩机 COP≈3，1 小时约 1 度电' },
  { name: '家用轿车发动机', v: 100, unit: 'kw', show: 'PS', note: '100 kW ≈ 136 PS ≈ 134 hp，紧凑级燃油车主流' },
  { name: '三相异步电机铭牌', v: 7.5, unit: 'kw', show: 'hp', note: '7.5 kW ≈ 10.1 hp，Y 系列最常见规格之一' },
  { name: '电吹风高风档', v: 1800, unit: 'W', show: 'hp', note: '1600-2200 W 常见，约 2.4 hp 级（家用插座上限内）' },
  { name: '自行车巡航输出', v: 200, unit: 'W', show: 'hp', note: '普通人持续 150-250 W，职业车手短时可达 1000 W' },
  { name: '16L 燃气热水器热负荷', v: 32, unit: 'kw', show: 'btuh', note: '热负荷口径（燃气输入），≈ 109000 BTU/h' },
  { name: '离心风机轴功率', v: 5.5, unit: 'kw', show: 'PS', note: '≈ 7.5 PS，风机制造商样本常按 kW 或 PS 双标' }
].map((s) => ({
  name: s.name,
  v: s.v,
  unit: s.unit,
  valueText: `${s.v} ${unitById(s.unit)?.symbol || s.unit}`,
  convertedText: `${fmtPower(convertPower(s.v, s.unit, s.show))} ${unitById(s.show)?.symbol || s.show}`,
  note: s.note
}))

const quickKwPsTable = [1, 2, 3, 5, 7.5, 10].map((v) => ({
  value: v,
  converted: fmtPower(convertPower(v, 'kw', 'PS'))
}))
const quickHpKwTable = [1, 2, 5, 10, 20, 50].map((v) => ({
  value: v,
  converted: fmtPower(convertPower(v, 'hp', 'kw'))
}))

// 空调匹数对照：制冷量（销售口径）与电功率估算（COP≈3 折算）
const acHorsepowerRows = [
  { label: '1 匹（小 1 匹）', coolingW: '2300-2500', powerW: 770, psText: '1.05 PS' },
  { label: '1.5 匹', coolingW: '3200-3500', powerW: 1100, psText: '1.50 PS' },
  { label: '2 匹', coolingW: '4500-5000', powerW: 1500, psText: '2.04 PS' },
  { label: '3 匹', coolingW: '7000-7500', powerW: 2250, psText: '3.06 PS' }
].map((r) => ({ ...r, psText: fmtPower(convertPower(r.powerW, 'W', 'PS')) }))

function loadScenario(row) {
  applyPreset(row.v, row.unit)
}

// ---------- 复制（浏览器 API 仅在回调中，SSR 安全） ----------
const copied = ref(false)
let copyTimer = null

async function copyResults() {
  if (!canCopy.value) return
  try {
    await navigator.clipboard.writeText(copyText.value)
    copied.value = true
    if (copyTimer !== null) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copied.value = false }, 2000)
  } catch (error) {
    console.error('复制失败:', error)
    copied.value = false
  }
}

// ---------- SEO 折叠 ----------
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 设置持久化（localStorage，键前缀用工具 id，仅 onMounted/交互回调触达） ----------
const SETTINGS_KEY = `${TOOL_ID}-settings`

function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (UNITS.some(u => u.id === s.inputUnit)) inputUnit.value = s.inputUnit
    if (typeof s.inputValue === 'string' && parsePowerInput(s.inputValue) !== null) inputValue.value = s.inputValue
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([inputUnit, inputValue], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      inputUnit: inputUnit.value,
      inputValue: inputValue.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})

onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})
</script>
