<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Frame class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">印刷出血参考生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">名片 / 海报 / 画册 / 折页 / 易拉宝等常见印品的成品尺寸、3mm 出血与安全区可视化，附送印自查清单</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线印刷出血参考工具：选一种印品（名片 90×54、A 系海报、画册、三折页、易拉宝、横幅等），
        立即给出成品尺寸、四边出血（通行 3mm，大幅喷绘类更多）、安全边距（名片内文距边≥3mm、一般≥5mm，
        均为行业通行惯例）与「出血区 → 成品线 → 安全区」三层可视化示意；自定义模式可输入任意成品宽高和
        0/2/3/5mm 出血，一键生成四边扩算后的制作尺寸。内置送印前自查清单（CMYK、文字转曲、300dpi、
        单色黑等印厂高频退稿项，勾选本地保存不上传）。全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：参数面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Frame class="w-5 h-5 mr-2 text-primary" /> 选择印品或自定义
        </h2>

        <!-- 印品类型 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-1.5">印品类型</p>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            <button
              v-for="t in PRINT_TYPES"
              :key="t.id"
              type="button"
              class="px-2.5 py-1.5 rounded-md text-xs font-medium border transition text-left"
              :class="typeId === t.id && !isCustom ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
              @click="applyType(t)"
            >{{ t.name }}</button>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">{{ activeType ? activeType.note : '选择上方类型或切到自定义' }}</p>
        </div>

        <!-- 自定义模式 -->
        <div class="border-t border-border pt-4 space-y-3">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-foreground">自定义成品尺寸</p>
            <button
              type="button"
              class="px-2.5 py-1 rounded-md text-xs font-medium border transition"
              :class="isCustom ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
              @click="isCustom = true"
            >切到自定义</button>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <input
              v-model.number="cusW"
              type="number"
              min="1"
              step="1"
              aria-label="成品宽度 mm"
              class="w-24 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
            <span class="text-sm text-muted-foreground">×</span>
            <input
              v-model.number="cusH"
              type="number"
              min="1"
              step="1"
              aria-label="成品高度 mm"
              class="w-24 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
            <span class="text-xs text-muted-foreground">mm</span>
          </div>
          <div>
            <p class="text-xs font-medium text-foreground mb-1.5">出血量（四边同值）</p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="b in BLEED_OPTIONS"
                :key="b"
                type="button"
                class="px-2.5 py-1 rounded-md text-xs font-medium border transition"
                :class="cusBleed === b ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
                @click="cusBleed = b"
              >{{ b === 0 ? '不出血' : `${b}mm` }}</button>
            </div>
          </div>
          <div>
            <label for="pb-safe" class="text-xs font-medium text-foreground block mb-1.5">安全边距（重要内容距成品边）</label>
            <input
              id="pb-safe"
              v-model.number="cusSafe"
              type="number"
              min="0"
              step="0.5"
              class="w-24 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
            <span class="text-xs text-muted-foreground ml-2">mm（名片≥3，一般≥5，行业通行惯例）</span>
          </div>
        </div>
      </div>

      <!-- 右：结果 -->
      <div class="space-y-4">
        <!-- 尺寸结果卡 -->
        <div class="bg-card border border-primary/40 rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> 出血扩算结果
          </h2>
          <div v-if="result" class="space-y-4">
            <div class="grid grid-cols-3 gap-3">
              <div class="bg-muted/50 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">成品尺寸</p>
                <p class="text-lg font-bold text-foreground font-mono leading-tight">{{ result.w }} × {{ result.h }}</p>
                <p class="text-[10px] text-muted-foreground mt-1">mm</p>
              </div>
              <div class="bg-primary/10 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">制作尺寸（含出血）</p>
                <p class="text-lg font-bold text-primary font-mono leading-tight">{{ result.w2 }} × {{ result.h2 }}</p>
                <p class="text-[10px] text-muted-foreground mt-1">四边各加 {{ result.bleed }}mm</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">安全区（文字区）</p>
                <p class="text-lg font-bold text-foreground font-mono leading-tight">{{ result.safeW }} × {{ result.safeH }}</p>
                <p class="text-[10px] text-muted-foreground mt-1">内缩 {{ result.safe }}mm</p>
              </div>
            </div>

            <!-- 三层可视化（比例示意） -->
            <div class="flex justify-center py-2">
              <div
                class="border-2 border-dashed border-amber-500/70 bg-amber-500/10 relative flex items-center justify-center"
                :style="{ width: viz.outerW + 'px', height: viz.outerH + 'px' }"
              >
                <span class="absolute -top-0.5 left-1 text-[10px] text-amber-600 bg-card px-1 rounded">出血区 +{{ result.bleed }}mm</span>
                <div
                  class="border-2 border-primary bg-background relative flex items-center justify-center"
                  :style="{ width: viz.midW + 'px', height: viz.midH + 'px' }"
                >
                  <span class="absolute -top-0.5 left-1 text-[10px] text-primary bg-card px-1 rounded">成品线</span>
                  <div
                    class="border border-dashed border-green-600/80 bg-green-500/10 flex items-center justify-center"
                    :style="{ width: viz.safeW + 'px', height: viz.safeH + 'px' }"
                  >
                    <span class="text-[10px] text-green-700 text-center leading-tight px-1">安全区<br>{{ result.safeW }}×{{ result.safeH }}</span>
                  </div>
                </div>
              </div>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
              <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>外层虚线框 = 制作尺寸（出血区，背景图必须铺满到这里）；中间实线框 = 成品裁切线；内层虚线框 = 安全区，文字与 Logo 只放进这里。示意图按比例缩放，数值以毫米为准。</span>
            </p>
            <button
              type="button"
              class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition"
              @click="copyResult"
            >
              <Copy class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 复制送印参数文本
            </button>
          </div>
          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <TriangleAlert class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">尺寸无效</p>
              <p class="text-xs text-muted-foreground mt-1">成品宽、高需为大于 0 的数值；出血量限 0/2/3/5mm，安全边距需不小于 0。</p>
            </div>
          </div>
        </div>

        <!-- 送印自查清单 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <ListChecks class="w-5 h-5 mr-2 text-primary" /> 送印前自查清单
          </h2>
          <p class="text-xs text-muted-foreground mb-3 leading-relaxed">印厂高频退稿/翻车项整理（通行惯例，以合作印厂要求为准）：{{ doneCount }}/{{ CHECKLIST.length }} 已确认。</p>
          <div class="space-y-1.5">
            <label
              v-for="(item, i) in CHECKLIST"
              :key="i"
              class="flex items-start gap-2 p-2 rounded-lg border border-border bg-muted/40 cursor-pointer hover:bg-muted/60 transition"
            >
              <input
                v-model="checked"
                type="checkbox"
                :value="i"
                class="mt-0.5 accent-current"
              >
              <span class="text-xs leading-relaxed text-foreground">{{ item }}</span>
            </label>
          </div>
          <button
            type="button"
            class="mt-3 w-full px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
            @click="resetChecklist"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 清空勾选
          </button>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-6" open>
      <summary class="text-base font-semibold text-foreground cursor-pointer select-none mb-4">为什么要出血、公式依据与常见问题</summary>

      <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>印刷出血参考生成器是什么？</h2>
      <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
        出血（bleed）是把成品稿的背景图案向外延伸的一段"牺牲区"：印刷裁切成品时有 ±1~2mm 的公差，
        刀口可能在成品线内外摆动。如果背景只画到成品线就停，刀稍微偏外就露白边；把底图铺到成品线外 3mm（出血区），
        裁切偏差才不会露白。本工具按印品类型给出成品尺寸、出血与安全区（重要内容距成品边的最小距离，防止被刀口裁掉），
        并生成三层可视化示意，帮你一次把画板尺寸设对。
      </p>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">计算公式与通行数值</h3>
      <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
        <li>制作尺寸 = 成品尺寸 + 2 × 出血量（四边各加一份）：名片 90×54mm + 四边 3mm → 96×60mm。</li>
        <li>安全区尺寸 = 制作尺寸 − 2 × 安全边距；安全区中心与成品中心同心。</li>
        <li>出血量通行值：胶印类（名片/单页/画册/折页）3mm，部分印厂收 2mm 或 5mm，白底文件可与印厂确认免出血（拼公刀）；易拉宝/横幅等大幅制作常留 20~30mm 以上（画面收口/热合包边）。</li>
        <li>安全边距通行值：名片类小成品内文距成品边 ≥3mm，一般印品 ≥5mm，画册注意装订侧再另留 10~20mm 订口。</li>
        <li>上述均为行业通行惯例整理（多印厂规范交叉核对），各厂机器幅面与工艺不同，下单以合作印厂要求为准。</li>
      </ul>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么要出血？裁切公差 ±1~2mm</h3>
      <p class="text-sm text-muted-foreground leading-relaxed">
        印刷裁切是机械动作，一沓几百张纸在裁切机上对位有 ±1~2mm 的正常偏差，双面印刷品正反面对位还会有相对偏差。
        出血解决"少切露白"，安全区解决"多切裁字"：背景色/底图向外多铺 3mm，即使刀口偏外 1~2mm 也不会出现白边；
        文字、Logo、条码向内缩 3~5mm，即使刀口偏内也不会被切到。两者夹住成品线，裁切公差就被吸收掉了。
        另外深色底尽量满版铺色并选"叠印"以外的正常压色，双面品注意正反面主内容位置一致，减少偏刀的可见度。
      </p>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">CMYK 还是 RGB？</h3>
      <p class="text-sm text-muted-foreground leading-relaxed">
        印刷文件用 CMYK（四色油墨），屏幕显示用 RGB。RGB 色域比 CMYK 大，荧光绿、亮橙、深蓝紫等高饱和色
        转成 CMYK 后会明显变灰变暗——设计时直接用 CMYK 模式或在交付前"校样颜色"预览，避免成品与屏幕落差过大。
        黑色小字用单色黑 K100（四色 100 黑会因套印误差发虚重影）；大面积四色黑底反而要按印厂建议给足黑位。
        位图按原大尺寸 300dpi 备图，低于 150dpi 的图印出来会明显发糊。
      </p>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">搭配工具</h3>
      <p class="text-sm text-muted-foreground leading-relaxed">
        要按纸张开数倒推能拼几个成品，用本站纸张开数计算器：
        <NuxtLink to="/tools/paper-cut-size-calculator/" class="text-primary font-medium hover:underline">/tools/paper-cut-size-calculator/</NuxtLink>；
        大幅喷绘/写真画面的分辨率要求，用喷绘写真分辨率计算器：
        <NuxtLink to="/tools/large-format-resolution/" class="text-primary font-medium hover:underline">/tools/large-format-resolution/</NuxtLink>。
      </p>

      <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
      <div class="space-y-4">
        <div>
          <h3 class="text-base font-semibold text-foreground">名片出血后文件应做多大？</h3>
          <p class="text-sm text-muted-foreground mt-1">
            名片成品 90×54mm，四边各加 3mm 出血，文件应做 96×60mm；文字与 Logo 距成品边至少 3mm
            （即距文件边缘 6mm 以上）。背景底色铺满整个 96×60，防止裁切露白。通行惯例以印厂要求为准。
          </p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">不出血（白底）文件可以吗？</h3>
          <p class="text-sm text-muted-foreground mt-1">
            整版白底、成品边也是白色的文件可以不出血（印厂可拼公刀按白边裁），但只要有底色、底图或色块贴边，
            就必须做出血，否则裁切偏差会露出白边或白角。拿不准时统一按 3mm 出血最稳妥。
          </p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">易拉宝、横幅的出血怎么留？</h3>
          <p class="text-sm text-muted-foreground mt-1">
            大幅喷绘写真类与胶印不同：易拉宝画面 80×200cm 通常上下各多留 5cm 左右收进卷轴盒、两侧按制作商要求；
            布类横幅四周留 20~30mm 用于热合/包边。重要文字同样向内缩 5cm 以上。各制作商规范差异大，
            本页预设值仅为通行参考，下单前务必按对方要求核一遍。
          </p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">送印清单里"文字转曲""单色黑"是什么意思？</h3>
          <p class="text-sm text-muted-foreground mt-1">
            文字转曲（创建轮廓）是把字体变成矢量路径，印厂电脑没装你的字体也不会变成宋体/缺字，是最高频的退稿原因；
            单色黑指黑色小字只给 K100（C0 M0 Y0 K100），不用四色黑，否则黄品青版轻微套印偏差会让小字发糊带彩边。
          </p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">清单勾选记录会上传吗？</h3>
          <p class="text-sm text-muted-foreground mt-1">
            不会。勾选状态只保存在当前浏览器页面会话内，刷新后重置；尺寸扩算全部为本地算术，无任何网络请求。
          </p>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'print-bleed-guide'" :category="'design'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Frame, Ruler, Info, TriangleAlert, Copy, ListChecks, RefreshCw
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '印刷出血参考生成器 - 出血3mm/安全区可视化与送印自查清单 | 有条工具',
  description: '免费在线印刷出血参考工具：名片 90×54、海报 A 系列、画册、折页、易拉宝、横幅等常见印品成品尺寸+3mm 出血+安全边距一键扩算，出血液可视化三层示意（出血区/成品线/安全区），自定义宽高与 0/2/3/5mm 出血，附 CMYK、文字转曲、300dpi 送印自查清单，纯浏览器本地计算不上传',
  keywords: '印刷出血多少毫米,出血位设置,名片出血尺寸,印刷安全区,送印前检查清单',
  author: '有条工具',
  ogTitle: '印刷出血参考生成器 - 出血/安全区可视化与送印清单 | 有条工具',
  ogDescription: '选印品类型即得成品尺寸+3mm 出血+安全边距扩算与三层可视化，附送印自查清单。',
  ogUrl: 'https://www.util.cn/tools/print-bleed-guide',
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
          name: '印刷出血参考生成器',
          url: 'https://www.util.cn/tools/print-bleed-guide',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '名片/海报/画册/折页/易拉宝/横幅常见印品出血预设',
            '成品尺寸+出血=制作尺寸一键扩算',
            '出血区/成品线/安全区三层可视化示意',
            '自定义成品宽高与 0/2/3/5mm 出血',
            '安全边距提示（名片≥3mm、一般≥5mm 通行惯例）',
            '送印前自查清单（CMYK/转曲/300dpi/单色黑等）',
            '本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '设计工具', item: 'https://www.util.cn/design/' },
            { '@type': 'ListItem', position: 3, name: '印刷出血参考生成器', item: 'https://www.util.cn/tools/print-bleed-guide' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '名片出血后文件应做多大？',
              acceptedAnswer: { '@type': 'Answer', text: '名片成品 90×54mm，四边各加 3mm 出血，文件应做 96×60mm；文字与 Logo 距成品边至少 3mm（距文件边缘 6mm 以上），背景铺满 96×60 防止裁切露白。' }
            },
            {
              '@type': 'Question',
              name: '不出血（白底）文件可以吗？',
              acceptedAnswer: { '@type': 'Answer', text: '成品边为白色的整版白底文件可以不出血（拼公刀按白边裁）；只要有底色或色块贴边就必须做出血，否则 ±1~2mm 裁切公差会露白边。拿不准时统一按 3mm 出血。' }
            },
            {
              '@type': 'Question',
              name: '易拉宝、横幅的出血怎么留？',
              acceptedAnswer: { '@type': 'Answer', text: '大幅制作与胶印不同：易拉宝 80×200cm 通常上下多留 5cm 左右收卷轴、布类横幅四周留 20~30mm 热合包边，重要文字内缩 5cm 以上，具体以制作商要求为准。' }
            },
            {
              '@type': 'Question',
              name: '送印清单里"文字转曲""单色黑"是什么意思？',
              acceptedAnswer: { '@type': 'Answer', text: '文字转曲是把字体变成矢量路径，印厂没有你的字体也不会缺字变宋体；单色黑指黑色小字只给 K100 不用四色黑，避免四色套印误差让小字发糊带彩边。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 单位：mm。核心公式：制作尺寸 = 成品 + 2×出血；安全区 = 制作尺寸 − 2×安全边距。
// 出血/安全边距为行业通行惯例整理（多印厂规范交叉核对），以合作印厂要求为准。
/* TESTABLE-START */
// 印品类型预设：成品尺寸（mm）、通行出血、通行安全边距
const PRINT_TYPE_DEFS = [
  { id: 'card', name: '名片', w: 90, h: 54, bleed: 3, safe: 3, note: '名片成品 90×54，四边 3mm 出血 → 制作 96×60；内文距成品边≥3mm。' },
  { id: 'dm-a4', name: 'DM单页 A4', w: 210, h: 297, bleed: 3, safe: 5, note: 'A4 单页成品 210×297，胶印类通行出血 3mm。' },
  { id: 'poster-a3', name: '海报 A3', w: 297, h: 420, bleed: 3, safe: 5, note: 'A3 海报成品 297×420，四边 3mm 出血。' },
  { id: 'poster-a2', name: '海报 A2', w: 420, h: 594, bleed: 3, safe: 5, note: 'A2 海报成品 420×594，四边 3mm 出血。' },
  { id: 'poster-a1', name: '海报 A1', w: 594, h: 841, bleed: 3, safe: 5, note: 'A1 海报成品 594×841，四边 3mm 出血。' },
  { id: 'album16', name: '画册 大16开', w: 210, h: 285, bleed: 3, safe: 5, note: '大度 16 开画册 210×285；装订侧另留 10~20mm 订口余量。' },
  { id: 'fold3', name: '三折页', w: 285, h: 210, bleed: 3, safe: 5, note: '大 16 开三折页展开 285×210，每折面约 95×210；折缝处避免压字。' },
  { id: 'rollup', name: '易拉宝 80×200', w: 800, h: 2000, bleed: 30, safe: 50, note: '易拉宝画面 800×2000mm，上下多留约 30mm 收卷轴，文字内缩 50mm，按制作商要求为准。' },
  { id: 'banner', name: '横幅 6m×0.8m', w: 6000, h: 800, bleed: 20, safe: 50, note: '布类横幅 6000×800mm，四周 20mm 热合包边；长度大时先确认幅宽上限。' }
]

const BLEED_OPTIONS = [0, 2, 3, 5]

// 出血扩算：非法输入返回 null
function bleedCalc(w, h, bleed) {
  const W = Number(w), H = Number(h), B = Number(bleed)
  if (!Number.isFinite(W) || !Number.isFinite(H) || W <= 0 || H <= 0) return null
  if (!Number.isFinite(B) || B < 0) return null
  return { w: W, h: H, bleed: B, w2: round1(W + 2 * B), h2: round1(H + 2 * B) }
}

// 安全区尺寸 = 制作尺寸 − 2×安全边距（下限 0）；非法安全边距返回 null
function safeCalc(w2, h2, safe) {
  const W2 = Number(w2), H2 = Number(h2), S = Number(safe)
  if (!Number.isFinite(W2) || !Number.isFinite(H2) || W2 <= 0 || H2 <= 0) return null
  if (!Number.isFinite(S) || S < 0) return null
  return { safeW: Math.max(0, round1(W2 - 2 * S)), safeH: Math.max(0, round1(H2 - 2 * S)) }
}

// 组合：成品+出血+安全 → 完整三层结果（安全边距缺省取通行值 5mm）
function fullSpec(w, h, bleed, safe) {
  const b = bleedCalc(w, h, bleed)
  if (!b) return null
  const effSafe = safe === undefined || safe === null || safe === '' ? 5 : Number(safe)
  const s = safeCalc(b.w2, b.h2, effSafe)
  if (!s) return null
  return { ...b, safe: effSafe, safeW: s.safeW, safeH: s.safeH }
}

// 可视化缩放：制作尺寸等比缩放到指定框内（宽 320px、高 260px 上限，最小 60px 保可点按）
function vizScale(w2, h2, maxW, maxH) {
  const W = Number(w2), H = Number(h2)
  if (!Number.isFinite(W) || !Number.isFinite(H) || W <= 0 || H <= 0) return null
  const ratio = Math.min(maxW / W, maxH / H)
  return { ratio, outerW: round1(W * ratio), outerH: round1(H * ratio) }
}

function round1(v) {
  return Math.round(Number(v) * 10) / 10
}
/* TESTABLE-END */

// ---------- 静态数据 ----------
const CHECKLIST = [
  '文档色彩模式已转 CMYK（屏幕 RGB 高饱和色印出来会变灰）',
  '所有文字已转曲 / 栅格化（印厂缺字体是最高频退稿原因）',
  '位图按原大尺寸 ≥300dpi（低于 150dpi 明显发糊）',
  '黑色小字用单色黑 K100（四色黑套印误差会发糊带彩边）',
  '背景图已拉满出血区，深色贴边底图确认不露白',
  '文字与 Logo 均在安全区内（名片距成品边≥3mm，一般≥5mm）',
  '条码 / 二维码留白充足且不在折线或裁切线上',
  '画册类已确认装订方式与订口余量（骑马订/锁线/胶装）',
  '文件格式按印厂要求（PDF/AI/TIF），专色与叠印已确认',
  '已与印厂核对出血量、成品尺寸与拼版方式'
]

// ---------- 响应式参数 ----------
const typeId = ref('card')
const isCustom = ref(false)
const cusW = ref(90)
const cusH = ref(54)
const cusBleed = ref(3)
const cusSafe = ref(3)
const checked = ref([])

const activeType = computed(() => PRINT_TYPE_DEFS.find((t) => t.id === typeId.value) || null)

// 当前生效参数：预设或自定义
const params = computed(() => {
  if (isCustom.value) return { w: cusW.value, h: cusH.value, bleed: cusBleed.value, safe: cusSafe.value, label: '自定义' }
  const t = activeType.value
  if (!t) return null
  return { w: t.w, h: t.h, bleed: t.bleed, safe: t.safe, label: t.name }
})

const result = computed(() => {
  const p = params.value
  if (!p) return null
  return fullSpec(p.w, p.h, p.bleed, p.safe)
})

// 可视化盒子（按制作尺寸等比缩放）
const viz = computed(() => {
  if (!result.value) return { outerW: 0, outerH: 0, midW: 0, midH: 0, safeW: 0, safeH: 0 }
  const b = result.value
  const v = vizScale(b.w2, b.h2, 320, 240)
  if (!v) return { outerW: 0, outerH: 0, midW: 0, midH: 0, safeW: 0, safeH: 0 }
  const midW = b.w2 > 0 ? (b.w / b.w2) * v.outerW : 0
  const midH = b.h2 > 0 ? (b.h / b.h2) * v.outerH : 0
  const safeW = b.w2 > 0 ? (b.safeW / b.w2) * v.outerW : 0
  const safeH = b.h2 > 0 ? (b.safeH / b.h2) * v.outerH : 0
  return {
    outerW: v.outerW,
    outerH: v.outerH,
    midW: Math.max(0, Math.round(midW)),
    midH: Math.max(0, Math.round(midH)),
    safeW: Math.max(0, Math.round(safeW)),
    safeH: Math.max(0, Math.round(safeH))
  }
})

const doneCount = computed(() => checked.value.length)

// ---------- 交互动作 ----------
function applyType(t) {
  typeId.value = t.id
  isCustom.value = false
  cusW.value = t.w
  cusH.value = t.h
  cusBleed.value = t.bleed
  cusSafe.value = t.safe
}

function resetChecklist() {
  checked.value = []
}

function resultText() {
  if (!result.value) return ''
  const r = result.value
  const label = isCustom.value ? '自定义印品' : (activeType.value ? activeType.value.name : '印品')
  return `送印参数（${label}）\n成品尺寸：${r.w} × ${r.h} mm\n出血：四边各 ${r.bleed} mm\n制作尺寸（含出血）：${r.w2} × ${r.h2} mm\n安全区（距成品边 ${r.safe}mm）：${r.safeW} × ${r.safeH} mm\n背景图铺满制作尺寸，重要内容只放安全区内。`
}

async function copyResult() {
  const text = resultText()
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制')
  } catch {
    alert('复制失败，请手动记录数值')
  }
}

onMounted(() => {
  addRecentTool('print-bleed-guide')
})
</script>
