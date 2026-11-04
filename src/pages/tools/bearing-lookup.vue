<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <CircleDot class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">轴承型号对照</h1>
          <p class="text-sm text-muted-foreground mt-1">常用滚动轴承尺寸查询与新旧代号对照，支持按内径筛选和内径+外径反查</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线轴承型号对照工具：内置深沟球（6000/6200/6300 系列）、角接触球（72/73 系列）、圆锥滚子（302/303 系列）共 49 个常用型号的外形尺寸库（内径 d、外径 D、宽度 B/T，单位 mm），
        新旧代号双向查询（输入 204 或 6204 都能定位）、按内径筛选、按内径+外径反查所有匹配型号。全部数据内置在浏览器本地，无需联网查询。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 查询条件卡 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center text-foreground">
          <Search class="w-5 h-5 mr-2 text-primary" /> 查询条件
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">代号 / 旧代号</label>
          <input
            v-model="query"
            type="text"
            placeholder="如 6204、204、30205、7205、7204C"
            class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
          >
          <p class="text-xs text-muted-foreground mt-1.5">新旧代号双向查询：输入新代号（6204）或旧代号（204）均可定位，支持模糊包含匹配</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">轴承类型</label>
          <select
            v-model="typeFilter"
            class="w-full px-3 py-2.5 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option v-for="t in typeOptions" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">内径 d（mm）</label>
          <input
            v-model.number="boreFilter"
            type="number"
            min="0"
            step="1"
            placeholder="如 25"
            class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
          >
          <div class="flex flex-wrap gap-1.5 mt-2">
            <button
              v-for="d in commonBores"
              :key="d"
              @click="pickBore(d)"
              :class="boreVal === d ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-2.5 py-1 rounded-md text-xs font-medium transition"
            >{{ d }}</button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">外径 D（mm）反查</label>
          <input
            v-model.number="outerFilter"
            type="number"
            min="0"
            step="1"
            placeholder="如 52（与内径同时填写时反查）"
            class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
          >
          <p class="text-xs text-muted-foreground mt-1.5">
            同时填写内径与外径时按「内径 + 外径」反查，列出所有 d 与 D 都匹配的型号（宽度可不同），常用于现场测量轴颈与轴承室后的选型
          </p>
        </div>

        <button
          @click="resetFilters"
          class="w-full px-4 py-2.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition flex items-center justify-center gap-2"
        >
          <RotateCcw class="w-4 h-4" /> 重置筛选条件
        </button>
      </div>

      <!-- 结果卡 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold flex items-center text-foreground mb-4">
          <Table2 class="w-5 h-5 mr-2 text-primary" /> 查询结果
        </h2>

        <!-- 精确匹配定位卡 -->
        <div v-if="exactMatch" class="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-primary">精确匹配</span>
            <span class="text-xs text-muted-foreground">{{ exactMatch.type }}</span>
          </div>
          <p class="text-2xl font-bold text-foreground font-mono">{{ exactMatch.code }}</p>
          <p class="text-sm text-muted-foreground mt-1">
            旧代号 <span class="font-mono text-foreground">{{ exactMatch.oldCode }}</span>
            · 内径 {{ exactMatch.d }} mm
            · 外径 {{ exactMatch.D }} mm
            · 宽度 <span class="font-mono text-foreground">{{ formatWidth(exactMatch) }}</span> mm
          </p>
        </div>

        <div class="flex items-center justify-between mb-3">
          <p class="text-sm text-muted-foreground">
            共 <span class="font-semibold text-foreground">{{ filteredBearings.length }}</span> 个型号
            <span v-if="isReverseMode" class="ml-2 px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">d={{ boreVal }} + D={{ outerVal }} 反查</span>
          </p>
        </div>

        <div v-if="filteredBearings.length > 0" class="overflow-x-auto -mx-2 px-2 max-h-[26rem] overflow-y-auto">
          <table class="w-full text-sm min-w-[30rem]">
            <thead class="sticky top-0 bg-card">
              <tr class="text-left text-muted-foreground border-b border-border">
                <th class="py-2 pr-3 font-medium">新代号</th>
                <th class="py-2 pr-3 font-medium">旧代号</th>
                <th class="py-2 pr-3 font-medium">类型</th>
                <th class="py-2 pr-3 font-medium text-right">内径 d</th>
                <th class="py-2 pr-3 font-medium text-right">外径 D</th>
                <th class="py-2 font-medium text-right">宽度 B/T</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="b in filteredBearings"
                :key="b.code"
                class="border-b border-border/50 hover:bg-muted/50 transition-colors"
              >
                <td class="py-2 pr-3 font-semibold text-foreground font-mono">{{ b.code }}</td>
                <td class="py-2 pr-3 text-muted-foreground font-mono">{{ b.oldCode }}</td>
                <td class="py-2 pr-3 text-muted-foreground text-xs">{{ b.type }}</td>
                <td class="py-2 pr-3 text-right text-foreground font-mono">{{ b.d }}</td>
                <td class="py-2 pr-3 text-right text-foreground font-mono">{{ b.D }}</td>
                <td class="py-2 text-right text-foreground font-mono">
                  {{ formatWidth(b) }}<span v-if="b.tapered" class="text-[10px] text-muted-foreground ml-0.5">(T)</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="p-8 text-center text-muted-foreground text-sm">
          <Crosshair class="w-8 h-8 mx-auto mb-3 opacity-40" />
          没有匹配的型号，请调整代号、类型或尺寸条件
        </div>

        <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
          宽度列单位 mm：球轴承为宽度 B；圆锥滚子轴承为装配总宽 T（带 (T) 标记，允许小数）。
          额定载荷与寿命请以各厂家样本为准，本表仅提供外形尺寸。
        </p>
      </div>
    </div>

    <!-- 使用提示 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-card border border-border rounded-lg p-4">
        <h3 class="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <Sigma class="w-4 h-4 text-primary" /> 内径代号速算
        </h3>
        <p class="text-xs text-muted-foreground leading-relaxed">
          代号 00=10mm、01=12mm、02=15mm、03=17mm；04 及以上 = 代号 × 5mm。例如 6204 的内径 = 4×5 = 20mm，6305 = 5×5 = 25mm。
        </p>
      </div>
      <div class="bg-card border border-border rounded-lg p-4">
        <h3 class="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <ArrowRightLeft class="w-4 h-4 text-primary" /> 新旧代号对应规律
        </h3>
        <p class="text-xs text-muted-foreground leading-relaxed">
          深沟球：6204 ↔ 204、6004 ↔ 104、6305 ↔ 305；圆锥滚子：30205 ↔ 7205、30307 ↔ 7307；角接触球轴承：7204C ↔ 36204、7306C ↔ 36306。
        </p>
      </div>
      <div class="bg-card border border-border rounded-lg p-4">
        <h3 class="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <Info class="w-4 h-4 text-primary" /> 旧代号 7205 注意区分
        </h3>
        <p class="text-xs text-muted-foreground leading-relaxed">
          旧代号 7205 指圆锥滚子轴承（新代号 30205）；而新型号 7205C 是角接触球轴承（旧代号 36205）。输入 7205 时两者都会列出，注意看类型列。
        </p>
      </div>
    </div>

    <!-- 免责声明 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-8 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        免责声明：本工具收录的为常用滚动轴承外形尺寸（依据 GB/T 276、GB/T 292、GB/T 297 等标准系列尺寸整理），仅供选型参考。
        轴承的额定载荷、极限转速与寿命请以厂家样本为准；同一型号不同厂家、不同游隙/精度等级的参数可能有差异，采购与更换前请核对实物与样本。
      </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>什么是轴承型号对照？</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            轴承型号对照是指把轴承的新代号（GB/T 272 规定的现行代号，如 6204）、旧代号（老国标代号，如 204）与其外形尺寸（内径 d、外径 D、宽度 B）对应起来的查询过程。
            机修、设备维护人员在更换轴承时，经常只能看到旧设备手册上的旧代号，或者只能实测出轴颈与轴承室的尺寸，需要反查可用的型号，本工具就是为这些场景准备的。
          </p>

          <h3 class="text-lg font-semibold text-foreground">如何使用本工具</h3>
          <ol class="list-decimal list-inside space-y-1.5">
            <li>知道型号：直接在「代号 / 旧代号」输入 6204 或 204，精确匹配会置顶显示完整尺寸</li>
            <li>只知道内径：在「内径 d」填入实测轴径（如 25），列出所有该内径的型号，再按安装空间选外径</li>
            <li>内径外径都知道：同时填入 d 与 D，反查所有尺寸匹配的型号（宽度可不同，注意核对宽度是否装得下）</li>
            <li>按类型缩小范围：用「轴承类型」筛选深沟球、角接触球或圆锥滚子轴承</li>
          </ol>

          <h3 class="text-lg font-semibold text-foreground">收录范围与数据说明</h3>
          <p>
            本工具收录 49 个常用型号：深沟球轴承 6000–6008、6200–6210、6300–6308 共 29 个（GB/T 276 系列）；角接触球轴承 7204C–7210C、7305C–7307C 共 10 个（GB/T 292 系列）；圆锥滚子轴承 30202–30208、30306–30308 共 10 个（GB/T 297 系列，宽度为装配总宽 T）。
            尺寸为标准系列外形尺寸，单位 mm。为保证数据可靠，本工具不提供额定载荷列——载荷与寿命请以厂家样本为准。
          </p>

          <h3 class="text-lg font-semibold text-foreground">轴承新旧代号对照规则</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">深沟球轴承</span>：新代号去掉类型前缀「6」即旧代号——6204 ↔ 204、6305 ↔ 305；特轻系列 6004 ↔ 104</li>
            <li><span class="text-foreground font-medium">圆锥滚子轴承</span>：新代号 302xx ↔ 旧 72xx、303xx ↔ 旧 73xx——30205 ↔ 7205、30307 ↔ 7307</li>
            <li><span class="text-foreground font-medium">角接触球轴承</span>：新代号 72xxC ↔ 旧 362xx、73xxC ↔ 旧 363xx——7204C ↔ 36204、7306C ↔ 36306</li>
            <li><span class="text-foreground font-medium">内径代号</span>：末两位表示内径——00=10、01=12、02=15、03=17、04 及以上 = 代号 × 5（mm）</li>
          </ul>

          <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">6204 轴承的内径外径是多少？</span>内径 20mm、外径 47mm、宽度 14mm，旧代号 204。这是最常用的深沟球轴承规格之一。</li>
            <li><span class="text-foreground font-medium">旧代号 7205 是新代号的什么轴承？</span>旧 7205 对应新代号 30205（圆锥滚子轴承，25×52×16.25mm）。注意与新型号 7205C（角接触球轴承，旧代号 36205）区分。</li>
            <li><span class="text-foreground font-medium">圆锥滚子轴承的宽度为什么有小数？</span>圆锥滚子轴承的宽度指装配总宽 T（GB/T 297 / ISO 355），由内圈宽 B、外圈宽 C 和挡边差组成，标准值本身允许一位小数，如 30205 的 T = 16.25mm。</li>
            <li><span class="text-foreground font-medium">为什么查不到载荷和寿命？</span>额定载荷与额定寿命取决于厂家、材料、保持架与游隙等级，同一外形尺寸不同厂家的载荷差异很大。为保证不误导，本工具只提供外形尺寸，载荷与寿命请以厂家样本为准。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'bearing-lookup'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { CircleDot, Search, Table2, Crosshair, RotateCcw, Sigma, ArrowRightLeft, Info, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '轴承型号对照 - 轴承尺寸查询与新旧代号对照工具',
  description: '在线轴承型号对照表：内置深沟球 6000/6200/6300、角接触 72/73、圆锥滚子 302/303 共 49 个常用型号尺寸（内径/外径/宽度），新旧代号双向查询（6204 或 204 均可定位），支持按内径筛选与内径+外径反查型号，机修设备维护必备，纯本地计算。',
  keywords: '轴承型号对照表, 轴承尺寸查询, 6204轴承内径外径, bearing size lookup, 轴承新旧代号对照, 深沟球轴承尺寸, 圆锥滚子轴承型号',
  author: '有条工具',
  ogTitle: '轴承型号对照 - 轴承尺寸查询与新旧代号对照',
  ogDescription: '49 个常用轴承型号尺寸库，新旧代号双向查询，按内径筛选、内径+外径反查',
  ogUrl: 'https://www.util.cn/tools/bearing-lookup',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '轴承型号对照 - 轴承尺寸查询',
  twitterDescription: '常用轴承尺寸库与新旧代号双向查询，按尺寸反查型号'
})

// JSON-LD 结构化数据
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: '轴承型号对照',
          url: 'https://www.util.cn/tools/bearing-lookup',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '常用轴承尺寸库（深沟球/角接触/圆锥滚子 49 个型号）',
            '新旧代号双向查询（6204 ↔ 204）',
            '按内径筛选',
            '内径+外径反查匹配型号',
            '内径代号速算说明'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: '轴承型号对照', item: 'https://www.util.cn/tools/bearing-lookup' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '6204 轴承的内径外径是多少？',
              acceptedAnswer: { '@type': 'Answer', text: '6204 深沟球轴承内径 20mm、外径 47mm、宽度 14mm，旧代号 204。' }
            },
            {
              '@type': 'Question',
              name: '旧代号 7205 是新代号的什么轴承？',
              acceptedAnswer: { '@type': 'Answer', text: '旧代号 7205 对应新代号 30205 圆锥滚子轴承（25×52×16.25mm）；新型号 7205C 是角接触球轴承，旧代号 36205，注意区分。' }
            },
            {
              '@type': 'Question',
              name: '为什么查不到轴承的额定载荷？',
              acceptedAnswer: { '@type': 'Answer', text: '额定载荷与寿命取决于厂家、材料与游隙等级，本工具仅提供外形尺寸；载荷与寿命请以厂家样本为准。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'bearing-lookup'

// 交互记录（SSR 安全：localStorage 仅在客户端执行）
const trackUse = () => { addRecentTool(TOOL_ID) }
onMounted(() => { trackUse() })

// ---------- 内置轴承尺寸库（单位 mm；圆锥滚子宽度为装配总宽 T） ----------
// >>> PURE-BEGIN
const bearingData = [
  // 深沟球轴承 6000 系列（旧代号 1xx）
  { code: '6000', oldCode: '100', type: '深沟球轴承', d: 10, D: 26, w: 8 },
  { code: '6001', oldCode: '101', type: '深沟球轴承', d: 12, D: 28, w: 8 },
  { code: '6002', oldCode: '102', type: '深沟球轴承', d: 15, D: 32, w: 9 },
  { code: '6003', oldCode: '103', type: '深沟球轴承', d: 17, D: 35, w: 10 },
  { code: '6004', oldCode: '104', type: '深沟球轴承', d: 20, D: 42, w: 12 },
  { code: '6005', oldCode: '105', type: '深沟球轴承', d: 25, D: 47, w: 12 },
  { code: '6006', oldCode: '106', type: '深沟球轴承', d: 30, D: 55, w: 13 },
  { code: '6007', oldCode: '107', type: '深沟球轴承', d: 35, D: 62, w: 14 },
  { code: '6008', oldCode: '108', type: '深沟球轴承', d: 40, D: 68, w: 15 },
  // 深沟球轴承 6200 系列（旧代号 2xx）
  { code: '6200', oldCode: '200', type: '深沟球轴承', d: 10, D: 30, w: 9 },
  { code: '6201', oldCode: '201', type: '深沟球轴承', d: 12, D: 32, w: 10 },
  { code: '6202', oldCode: '202', type: '深沟球轴承', d: 15, D: 35, w: 11 },
  { code: '6203', oldCode: '203', type: '深沟球轴承', d: 17, D: 40, w: 12 },
  { code: '6204', oldCode: '204', type: '深沟球轴承', d: 20, D: 47, w: 14 },
  { code: '6205', oldCode: '205', type: '深沟球轴承', d: 25, D: 52, w: 15 },
  { code: '6206', oldCode: '206', type: '深沟球轴承', d: 30, D: 62, w: 16 },
  { code: '6207', oldCode: '207', type: '深沟球轴承', d: 35, D: 72, w: 17 },
  { code: '6208', oldCode: '208', type: '深沟球轴承', d: 40, D: 80, w: 18 },
  { code: '6209', oldCode: '209', type: '深沟球轴承', d: 45, D: 85, w: 19 },
  { code: '6210', oldCode: '210', type: '深沟球轴承', d: 50, D: 90, w: 20 },
  // 深沟球轴承 6300 系列（旧代号 3xx）
  { code: '6300', oldCode: '300', type: '深沟球轴承', d: 10, D: 35, w: 11 },
  { code: '6301', oldCode: '301', type: '深沟球轴承', d: 12, D: 37, w: 12 },
  { code: '6302', oldCode: '302', type: '深沟球轴承', d: 15, D: 42, w: 13 },
  { code: '6303', oldCode: '303', type: '深沟球轴承', d: 17, D: 47, w: 14 },
  { code: '6304', oldCode: '304', type: '深沟球轴承', d: 20, D: 52, w: 15 },
  { code: '6305', oldCode: '305', type: '深沟球轴承', d: 25, D: 62, w: 17 },
  { code: '6306', oldCode: '306', type: '深沟球轴承', d: 30, D: 72, w: 19 },
  { code: '6307', oldCode: '307', type: '深沟球轴承', d: 35, D: 80, w: 21 },
  { code: '6308', oldCode: '308', type: '深沟球轴承', d: 40, D: 90, w: 23 },
  // 角接触球轴承（旧代号 36xxx，接触角 15°/C 型）
  { code: '7204C', oldCode: '36204', type: '角接触球轴承', d: 20, D: 47, w: 14 },
  { code: '7205C', oldCode: '36205', type: '角接触球轴承', d: 25, D: 52, w: 15 },
  { code: '7206C', oldCode: '36206', type: '角接触球轴承', d: 30, D: 62, w: 16 },
  { code: '7207C', oldCode: '36207', type: '角接触球轴承', d: 35, D: 72, w: 17 },
  { code: '7208C', oldCode: '36208', type: '角接触球轴承', d: 40, D: 80, w: 18 },
  { code: '7209C', oldCode: '36209', type: '角接触球轴承', d: 45, D: 85, w: 19 },
  { code: '7210C', oldCode: '36210', type: '角接触球轴承', d: 50, D: 90, w: 20 },
  { code: '7305C', oldCode: '36305', type: '角接触球轴承', d: 25, D: 62, w: 17 },
  { code: '7306C', oldCode: '36306', type: '角接触球轴承', d: 30, D: 72, w: 19 },
  { code: '7307C', oldCode: '36307', type: '角接触球轴承', d: 35, D: 80, w: 21 },
  // 圆锥滚子轴承（旧代号 72xx / 73xx，宽度为装配总宽 T）
  { code: '30202', oldCode: '7202', type: '圆锥滚子轴承', d: 15, D: 35, w: 11.75, tapered: true },
  { code: '30203', oldCode: '7203', type: '圆锥滚子轴承', d: 17, D: 40, w: 13.25, tapered: true },
  { code: '30204', oldCode: '7204', type: '圆锥滚子轴承', d: 20, D: 47, w: 15.25, tapered: true },
  { code: '30205', oldCode: '7205', type: '圆锥滚子轴承', d: 25, D: 52, w: 16.25, tapered: true },
  { code: '30206', oldCode: '7206', type: '圆锥滚子轴承', d: 30, D: 62, w: 17.25, tapered: true },
  { code: '30207', oldCode: '7207', type: '圆锥滚子轴承', d: 35, D: 72, w: 18.25, tapered: true },
  { code: '30208', oldCode: '7208', type: '圆锥滚子轴承', d: 40, D: 80, w: 19.75, tapered: true },
  { code: '30306', oldCode: '7306', type: '圆锥滚子轴承', d: 30, D: 72, w: 20.75, tapered: true },
  { code: '30307', oldCode: '7307', type: '圆锥滚子轴承', d: 35, D: 80, w: 22.75, tapered: true },
  { code: '30308', oldCode: '7308', type: '圆锥滚子轴承', d: 40, D: 90, w: 25.25, tapered: true }
]

const normalizeQuery = (s) => String(s || '').trim().toUpperCase().replace(/\s+/g, '')

// 查询匹配：精确匹配（新代号或旧代号完全相等）优先置顶，其余按包含匹配
function queryBearings(list, rawQuery) {
  const q = normalizeQuery(rawQuery)
  if (!q) return list
  const exact = list.filter(b => b.code === q || b.oldCode === q)
  const partial = list.filter(b => (b.code.includes(q) || b.oldCode.includes(q)) && !exact.includes(b))
  return [...exact, ...partial]
}

function formatWidth(b) {
  return b.tapered ? b.w.toFixed(2) : String(b.w)
}
// <<< PURE-END

// ---------- 页面状态 ----------
const query = ref('')
const typeFilter = ref('全部')
const boreFilter = ref(null)
const outerFilter = ref(null)

const typeOptions = ['全部', '深沟球轴承', '角接触球轴承', '圆锥滚子轴承']
const commonBores = [10, 12, 15, 17, 20, 25, 30, 35, 40, 45, 50]

const pickBore = (d) => {
  boreFilter.value = boreVal.value === d ? null : d
  trackUse()
}

const boreVal = computed(() => (Number.isFinite(boreFilter.value) && boreFilter.value > 0) ? boreFilter.value : null)
const outerVal = computed(() => (Number.isFinite(outerFilter.value) && outerFilter.value > 0) ? outerFilter.value : null)
const isReverseMode = computed(() => boreVal.value !== null && outerVal.value !== null)

// 精确匹配定位卡（独立于其他筛选条件，输入 204/6204 时始终展示）
const exactMatch = computed(() => {
  const q = normalizeQuery(query.value)
  if (!q) return null
  return bearingData.find(b => b.code === q || b.oldCode === q) || null
})

const filteredBearings = computed(() => {
  let list = queryBearings(bearingData, query.value)
  if (typeFilter.value !== '全部') list = list.filter(b => b.type === typeFilter.value)
  if (boreVal.value !== null) list = list.filter(b => b.d === boreVal.value)
  if (isReverseMode.value) list = list.filter(b => b.D === outerVal.value)
  return list
})

const resetFilters = () => {
  query.value = ''
  typeFilter.value = '全部'
  boreFilter.value = null
  outerFilter.value = null
  trackUse()
}

// ---------- SEO 折叠 ----------
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }
</script>
