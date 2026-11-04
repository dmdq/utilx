<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Footprints class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">鞋码对照转换器</h1>
          <p class="text-sm text-muted-foreground mt-1">脚长 cm / 中国码 / 欧码 EU / 美码 US / 英码 UK 五制互查，男女分表 + 童鞋表（11-21cm）</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线鞋码对照表工具：输入任一制式的尺码（脚长厘米、中国码、欧码 EU、美码 US、英码 UK），一键换算出其余全部制式与对应脚长；
        内置成人男女分表（脚长 21-31cm、0.5cm 步进）与童鞋表（11-21cm），支持就近档位映射与「偏大/偏小半码」提示，
        附四步量脚指南与海淘选码建议。全部换算在浏览器本地完成，不上传任何数据。
      </p>
      <!-- 诚实说明条 -->
      <div class="mt-4 flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-foreground">
        <Info class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <span>不同品牌楦型差异可达半码，海淘建议以品牌官方尺码表为准——本表给的是通用对照基准。</span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：换算摘要 + 常用锚点 + 口径说明 -->
      <div class="space-y-4">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 换算摘要
          </h2>
          <div class="bg-primary/10 rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">对应脚长</p>
            <p class="text-3xl font-bold text-primary">
              {{ result ? `${fmtSize(result.cm)} cm` : '—' }}
            </p>
            <p class="text-xs text-muted-foreground mt-1">
              输入：{{ activeTabMeta.label }} · {{ activeSystemLabel }} {{ inputValue.trim() || '—' }}
            </p>
          </div>
          <div class="space-y-1.5">
            <div
              v-for="line in summaryLines"
              :key="line.label"
              class="flex items-center justify-between text-sm px-2 py-1.5 rounded hover:bg-muted/50 transition-colors"
            >
              <span class="text-muted-foreground">{{ line.label }}</span>
              <span class="font-semibold" :class="line.input ? 'text-primary' : 'text-foreground'">
                {{ line.value }}<span v-if="line.input" class="text-[10px] font-normal text-primary ml-1">输入</span>
              </span>
            </div>
          </div>
          <p
            class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5"
            :class="result ? (result.exact ? 'bg-green-500/10' : 'bg-amber-500/10') : ''"
          >
            <CheckCircle v-if="result && result.exact" class="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
            <Info v-else class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>{{ summaryHint }}</span>
          </p>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Play class="w-5 h-5 mr-2 text-primary" /> 常用尺码速查
          </h2>
          <p class="text-xs text-muted-foreground">点击任意锚点自动填入上方换算卡：</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="pick in quickPicks"
              :key="pick.label"
              @click="applyPick(pick)"
              class="px-3 py-1.5 rounded-full border border-border bg-muted/50 hover:bg-primary/10 hover:border-primary/40 text-xs font-medium text-muted-foreground hover:text-primary transition"
            >
              {{ pick.label }}
            </button>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-2.5">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Info class="w-5 h-5 mr-2 text-primary" /> 对照口径说明
          </h2>
          <p class="text-xs text-muted-foreground leading-relaxed">中国码即脚长毫米口径：脚长 25.0cm = 中国码 250，与国际 Mondopoint 一致。</p>
          <p class="text-xs text-muted-foreground leading-relaxed">同一脚长男女美码标注不同（US 女 ≈ US 男 + 1.5），本表同时给出两个美码列，按购买渠道选读。</p>
          <p class="text-xs text-muted-foreground leading-relaxed">童鞋段 11-21cm 与成人段在 21cm 处无缝衔接（童鞋 US 13.5 约= 成人 US 3，欧码共用一套刻度）。</p>
          <p class="text-xs text-muted-foreground leading-relaxed">所有码制按通用对照基准构造，各品牌楦型差异可达半码，精确选购请以品牌页码表为准。</p>
        </div>
      </div>

      <!-- 右侧（占两列）：换算卡 + 对照表 + 量脚指南 + 海淘提示 -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 交互换算卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-lg font-semibold flex items-center">
              <RefreshCw class="w-5 h-5 mr-2 text-primary" /> 尺码换算
            </h2>
            <div class="flex gap-2">
              <button
                v-for="tab in tabOptions"
                :key="tab.key"
                @click="setTab(tab.key)"
                :class="activeTab === tab.key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1"
              >
                <Baby v-if="tab.key === 'child'" class="w-4 h-4" />{{ tab.label }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">已知尺码制式</label>
              <select
                v-model="inputSystem"
                class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option v-for="opt in systemOptions" :key="opt.key" :value="opt.key">{{ opt.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">输入尺码数值</label>
              <input
                v-model="inputValue"
                type="text"
                inputmode="decimal"
                placeholder="如 25 / 40 / 8.5 / 250"
                class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div class="flex gap-2">
            <button
              @click="fillExample"
              class="px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-sm font-medium text-primary transition"
            >
              <Play class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 试个例子
            </button>
            <button
              @click="resetInput"
              class="px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
            >
              <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 清空重置
            </button>
          </div>

          <!-- 大字换算结果 -->
          <div v-if="result" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div
              v-for="tile in resultTiles"
              :key="tile.key"
              class="bg-muted/40 border rounded-lg p-3 text-center space-y-1"
              :class="tile.input ? 'border-primary/40 bg-primary/10' : 'border-border'"
            >
              <p class="text-[10px] text-muted-foreground">{{ tile.label }}</p>
              <p class="text-2xl font-bold" :class="tile.input ? 'text-primary' : 'text-foreground'">{{ tile.value }}</p>
              <p v-if="tile.input" class="text-[10px] text-primary font-medium">← 输入制式</p>
              <p v-else class="text-[10px] text-transparent select-none">&nbsp;</p>
            </div>
          </div>
          <div v-else-if="inputValue.trim()" class="mt-1 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
            {{ rangeHint || '未能换算：请输入对照表范围内的数值（成人脚长 21-31cm、欧码 34-49；童鞋脚长 11-21cm、欧码 19-34）。' }}
          </div>
          <div v-else class="mt-1 p-4 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg">
            选择制式并输入任一尺码，其余制式与脚长即刻换算
          </div>

          <p v-if="result && rangeHint" class="text-xs text-primary bg-primary/5 border border-primary/20 rounded px-2.5 py-1.5 leading-relaxed">
            {{ rangeHint }}
          </p>
        </div>

        <!-- 完整对照表 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> {{ activeTabMeta.label }}完整对照表
          </h2>
          <p class="text-xs text-muted-foreground mb-4">
            {{ activeTab === 'child' ? '童鞋段：脚长 11-21cm，0.5cm 步进；欧码与成人段共用刻度，21cm 处无缝衔接' : '成人段：脚长 21-31cm，0.5cm 步进；美码按男女分列，输入值所在行自动高亮' }}
          </p>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-muted-foreground border-b border-border">
                  <th v-for="col in tableColumns" :key="col.key" class="py-2 pr-3 font-medium whitespace-nowrap">{{ col.label }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, i) in activeTable"
                  :key="row.cm"
                  class="border-b border-border/50 hover:bg-muted/50 transition-colors"
                  :class="i === highlightIndex ? 'bg-primary/10' : ''"
                >
                  <td v-for="col in tableColumns" :key="col.key" class="py-2.5 pr-3 whitespace-nowrap" :class="col.key === 'cm' ? 'font-medium text-foreground' : 'text-muted-foreground'">
                    {{ col.get(row) }}
                    <span v-if="col.key === 'cm' && i === highlightIndex" class="ml-1 px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-medium align-middle">输入档</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 量脚指南 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> 量脚指南（四步量准脚长）
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div v-for="(step, i) in measureSteps" :key="step.title" class="bg-muted/40 border border-border rounded-lg p-4">
              <p class="text-sm font-semibold text-foreground mb-1.5">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold mr-1.5 align-middle">{{ i + 1 }}</span>
                {{ step.title }}
              </p>
              <p class="text-xs text-muted-foreground leading-relaxed">{{ step.desc }}</p>
            </div>
          </div>
        </div>

        <!-- 海淘提示条 -->
        <div class="bg-muted/60 border border-border rounded-lg p-4 flex items-start gap-2">
          <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p class="text-sm text-foreground leading-relaxed">
            <span class="font-medium">海淘选码提示：</span>Nike / Adidas 按脚长选、Clarks 按英码、日牌按 cm——买前先查该品牌页码表。
            同一脚长在不同品牌间差半码很常见；收到鞋后先在室内地毯上试穿，别剪吊牌，留着退换余地。
          </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>鞋码对照转换器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          鞋码对照转换器是一款在线鞋子尺码换算工具。它内置按通行对照基准构造的常量对照表：成人段覆盖脚长 21-31cm（0.5cm 步进）、男女分表，
          童鞋段覆盖 11-21cm；每行给出脚长、中国码（脚长毫米口径）、欧码 EU、美码 US（男/女/童分列）与英码 UK 的对应关系。
          输入任一制式的尺码即可换算其余全部制式：脚长、中国码、美码、英码按线性口径精确反推后落到 0.5cm 就近档位，
          欧码因刻度约 0.67cm/码且与脚长非线性对齐，采用反查表就近匹配；当输入值恰落在两档之间时，会提示「偏大约半码」或「偏小约半码」并建议取偏大一档。
          全部换算在浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">脚长怎么量才准？</h3>
        <ol class="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>下午站立体测量：双脚站立承重后比坐姿、晨间大约 0.3-0.5cm，下午量出的数据最接近真实穿鞋状态。</li>
          <li>量对起止点：脚长 = 脚跟后缘凸点到最长脚趾顶端的直线距离（多数人最长趾是大脚趾，少数人是第二趾），不是鞋垫长。</li>
          <li>双脚踏纸描边取大：纸贴墙、脚跟贴墙站立，垂直向下描出整脚轮廓，量纵向最远两点；两只脚都要量，按较大的那只选码。</li>
          <li>穿常穿的袜子测量：运动鞋穿运动袜量、皮鞋穿薄袜量；量完后给脚长加 0.5-1cm 活动余量再对照本表选码。</li>
        </ol>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">美码和欧码差多少？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          两者没有固定的加减关系，不能「欧码减 33 得美码」硬套：1 个欧码约对应 0.67cm 脚长，而 1 个美码约对应 0.85cm（男）/1cm（童），
          两者刻度不等长，差值会随码段浮动。例如脚长 25.0cm 约为 EU 40、US 男 7、US 女 8.5、UK 6.5；脚长 26.5cm 约为 EU 42、US 男 8.5。
          想准确换算请直接在本页输入已知码查表，或干脆量脚长——脚长是唯一不依赖品牌标注的物理量。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">男女鞋码为什么不同？宽度差在哪？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          同样 25.0cm 的脚，男表标 US 7、女表标 US 8.5——这不是脚变了，而是美码男女用两套标注，女码数字整体比男码大 1.5 左右；
          欧码、英码、中国码则男女共用同一脚长刻度。宽度上，女鞋楦比同长男鞋楦更窄，脚掌偏宽或偏厚的人即使长度合适也可能挤脚，
          建议按「长度取档 + 宽度实际试穿微调」，宽脚选 D/2E 等加宽楦或直接取大半码。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">童鞋按脚长选还是按年龄选？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          一定按脚长选。同年龄孩子脚长可差 1.5cm 以上，年龄只是电商页面的粗略参考；而且童鞋换季、换品牌时楦型差异比成人鞋更大。
          正确做法：每 2-3 个月量一次脚长（儿童脚长年均长约 1cm），在童鞋段 11-21cm 内按本表就近取档，两档之间取偏大一档，
          留出约 1cm 生长与活动空间；超过 21cm 后即进入成人段对照表。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">海淘买鞋的退换货建议</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>买前先查该品牌官方尺码表：Nike / Adidas 直接按脚长（cm）列选，Clarks 用英码，日本品牌按 cm 标注，别跨品牌套用上一次的码。</li>
          <li>首次买某品牌先买一双试穿，确认档位后再囤；不确定时在两档间取偏大一档，厚袜/加鞋垫比挤脚好解决。</li>
          <li>选支持免费退换的渠道与付款方式，保留原包装与吊牌；试穿只在室内地毯上进行，避免影响二次销售。</li>
          <li>偏小、磨脚跟多数不是「穿穿就好」：长度不足（前顶后空）直接换大半码；宽度不足看有无加宽楦版本。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">脚长 25cm 穿什么码？鞋码对照表怎么看？</h3>
            <p class="text-sm text-muted-foreground mt-1">按通用对照基准：脚长 25.0cm ≈ 中国码 250 / 欧码 EU 40（39-40 视品牌）/ 美码 US 男 7 / 美码 US 女 8.5 / 英码 UK 6.5。在本页输入任一制式即可换算其余全部制式与对应脚长，输入值落在两档之间时会提示偏大/偏小约半码并建议取偏大一档。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">美码和欧码怎么换算？</h3>
            <p class="text-sm text-muted-foreground mt-1">没有固定加减关系：1 个欧码约对应 0.67cm 脚长，1 个美码约对应 0.85cm（男），刻度不等长导致差值随码段浮动，硬套「EU−33」会错半码以上。最可靠的做法是量脚长后查对照表，或直接在本页输入已知码反查。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">童鞋码怎么选？按年龄行吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">按脚长选，年龄只作粗略参考。在童鞋段 11-21cm 内就近取档，两档之间取偏大一档并留约 1cm 余量；儿童脚长年均长约 1cm，建议每 2-3 个月复测一次，超过 21cm 后改用成人对照表。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么同一脚长在不同品牌差半码？</h3>
            <p class="text-sm text-muted-foreground mt-1">各品牌楦型（长度放余量、宽度、鞋头造型）不同，标注虽共用一套码制，实际内长可差到半码。本表给的是通用对照基准，海淘或穿惯某品牌后精确选购，请以该品牌官方尺码表为准。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'shoe-size-converter'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Footprints, CheckCircle, ChevronUp, ChevronDown, Info,
  RefreshCw, Play, Ruler, Baby
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '鞋码对照转换器 - 鞋码对照表 | 美码欧码换算工具',
  description: '在线鞋码对照转换工具，脚长 cm、中国码、欧码 EU、美码 US（男女童）、英码 UK 五制互查，内置成人 21-31cm 与童鞋 11-21cm 完整对照表，就近档位换算、偏大偏小半码提示，附四步量脚指南与海淘选码建议，纯浏览器本地运行',
  keywords: '鞋码对照表,美码欧码换算,鞋子尺码,us eu 鞋码,脚长尺码',
  author: '有条工具',
  ogTitle: '鞋码对照转换器 - 鞋码对照表 | 美码欧码换算工具 | 有条工具',
  ogDescription: '脚长/中国码/欧码/美码/英码五制互查，男女分表 + 童鞋表，海淘选鞋必备。',
  ogUrl: 'https://www.util.cn/tools/shoe-size-converter',
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
          name: '鞋码对照转换器',
          url: 'https://www.util.cn/tools/shoe-size-converter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['脚长 cm/中国码/欧码 EU/美码 US/英码 UK 五制互查', '成人男女分表 21-31cm（0.5cm 步进）', '童鞋表 11-21cm 与成人段无缝衔接', '就近档位映射与偏大/偏小半码提示', '输入值所在行对照表高亮', '四步量脚指南与海淘选码建议', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '鞋码对照转换器', item: 'https://www.util.cn/tools/shoe-size-converter/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '脚长25cm穿什么码？鞋码对照表怎么看？',
              acceptedAnswer: { '@type': 'Answer', text: '按通用对照基准：脚长25.0cm约等于中国码250、欧码EU 40（39-40视品牌）、美码US男7、美码US女8.5、英码UK 6.5。在工具页输入任一制式即可换算其余全部制式与对应脚长，输入值落在两档之间时会提示偏大/偏小约半码并建议取偏大一档。' }
            },
            {
              '@type': 'Question',
              name: '美码和欧码怎么换算？',
              acceptedAnswer: { '@type': 'Answer', text: '两者没有固定加减关系：1个欧码约对应0.67cm脚长，1个美码约对应0.85cm（男），刻度不等长导致差值随码段浮动，硬套EU减33会错半码以上。最可靠的做法是量脚长后查对照表，或直接输入已知码反查。' }
            },
            {
              '@type': 'Question',
              name: '童鞋码怎么选？按年龄行吗？',
              acceptedAnswer: { '@type': 'Answer', text: '按脚长选，年龄只作粗略参考。在童鞋段11-21cm内就近取档，两档之间取偏大一档并留约1cm余量；儿童脚长年均长约1cm，建议每2-3个月复测一次，超过21cm后改用成人对照表。' }
            },
            {
              '@type': 'Question',
              name: '为什么同一脚长在不同品牌差半码？',
              acceptedAnswer: { '@type': 'Answer', text: '各品牌楦型的长度放余量、宽度与鞋头造型不同，标注虽共用一套码制，实际内长可差到半码。通用对照表只给基准值，海淘或精确选购请以该品牌官方尺码表为准。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 通用对照口径：中国码 = 脚长毫米（Mondopoint）；欧码按巴黎刻度（楦长 = 脚长 + 1.5cm，1 欧码 = 2/3cm）取半码就近；
// 美码/英码为线性口径：US 男 = cm − 18、US 女 = cm − 16.5、UK = cm − 18.5、US 童 = cm − 7.5、UK 童 = cm − 8.5。
const FOOT_ADULT_MIN = 21   // 成人段脚长下限（cm）
const FOOT_ADULT_MAX = 31   // 成人段脚长上限（cm）
const FOOT_CHILD_MIN = 11   // 童鞋段脚长下限（cm）
const FOOT_CHILD_MAX = 21   // 童鞋段脚长上限（cm）
const EU_LAST_ALLOWANCE = 1.5 // 欧码楦长相对脚长的放余量（cm）

// 尺码展示格式：整数去掉小数尾巴（40.0 → 40），半码保留 1 位（40.5）
function fmtSize(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  const r = Math.round(n * 10) / 10
  return Number.isInteger(r) ? String(r) : r.toFixed(1)
}

// 脚长 → 欧码（巴黎刻度：EU =（脚长 + 放余量）× 1.5，就近半码取整），成人/童鞋共用一套刻度
function euFromCm(cm) {
  return Math.round((cm + EU_LAST_ALLOWANCE) * 1.5 * 2) / 2
}

// 成人单行：脚长 → 五制
function buildAdultRow(cm) {
  return { cm, cn: Math.round(cm * 10), eu: euFromCm(cm), usM: cm - 18, usW: cm - 16.5, uk: cm - 18.5 }
}

// 童鞋单行：脚长 → 童码（美/英童码刻度与成人不同）
function buildChildRow(cm) {
  return { cm, cn: Math.round(cm * 10), eu: euFromCm(cm), usK: cm - 7.5, ukK: cm - 8.5 }
}

// 按起止脚长（0.5cm 步进）构造常量对照表
function buildTable(startCm, endCm, buildRow) {
  const rows = []
  for (let cm = startCm; cm <= endCm + 1e-9; cm += 0.5) rows.push(buildRow(cm))
  return rows
}

const ADULT_TABLE = buildTable(FOOT_ADULT_MIN, FOOT_ADULT_MAX, buildAdultRow)
const CHILD_TABLE = buildTable(FOOT_CHILD_MIN, FOOT_CHILD_MAX, buildChildRow)

// 就近档位查找：返回最近的行、是否精确命中、偏差方向与提示。
// 输入值落在两档之间时提示「偏大约半码 / 偏小约半码」；|偏差| 超过 maxDiff 视为超出对照范围返回 null。
function nearestSizeOf(table, value, key, maxDiff = 2) {
  if (!Array.isArray(table) || table.length === 0) return null
  const num = Number(value)
  if (!Number.isFinite(num)) return null
  let best = 0
  let bestDiff = Math.abs(table[0][key] - num)
  for (let i = 1; i < table.length; i++) {
    const d = Math.abs(table[i][key] - num)
    if (d < bestDiff) { bestDiff = d; best = i }
  }
  if (bestDiff > maxDiff) return null
  const row = table[best]
  const prev = best > 0 ? table[best - 1] : null
  const next = best < table.length - 1 ? table[best + 1] : null
  const exact = bestDiff < 1e-9
  const diff = num - row[key]
  let hint
  if (exact) {
    hint = '输入值恰好命中该档，可直接按本档选码。'
  } else if (diff > 0) {
    hint = `输入值介于 ${fmtSize(row[key])} 与 ${next ? fmtSize(next[key]) : fmtSize(row[key] + 0.5)} 两档之间，更接近 ${fmtSize(row[key])}（偏大约半码）；脚长在两档之间时建议选偏大一档。`
  } else {
    hint = `输入值介于 ${prev ? fmtSize(prev[key]) : fmtSize(row[key] - 0.5)} 与 ${fmtSize(row[key])} 两档之间，更接近 ${fmtSize(row[key])}（偏小约半码）；脚长在两档之间时建议选偏大一档。`
  }
  return { row, index: best, exact, diff, hint }
}

// 非欧码制式 → 脚长（cm）反推（欧码非线性，须走反查表，此处返回 null）
function toCmInput(value, system, gender = 'men') {
  const num = Number(value)
  if (!Number.isFinite(num)) return null
  switch (system) {
    case 'cm': return num
    case 'cn': return num / 10
    case 'us': return num + (gender === 'women' ? 16.5 : gender === 'child' ? 7.5 : 18)
    case 'usM': return num + 18
    case 'usW': return num + 16.5
    case 'usK': return num + 7.5
    case 'uk': return num + (gender === 'child' ? 8.5 : 18.5)
    case 'ukK': return num + 8.5
    default: return null // eu 走反查表
  }
}

// 脚长 → 五制（就近档位映射）；gender = 'child' 时走童鞋表，uk 返回童码
function convertFromCm(cm, gender = 'men') {
  const table = gender === 'child' ? CHILD_TABLE : ADULT_TABLE
  const hit = nearestSizeOf(table, cm, 'cm')
  if (!hit) return null
  const row = hit.row
  if (gender === 'child') {
    return { cm: row.cm, cn: row.cn, eu: row.eu, usM: null, usW: null, uk: row.ukK, usK: row.usK, ukK: row.ukK, exact: hit.exact, hint: hit.hint }
  }
  return { cm: row.cm, cn: row.cn, eu: row.eu, usM: row.usM, usW: row.usW, uk: row.uk, exact: hit.exact, hint: hit.hint }
}

// 任意制式 → 脚长 → 各制式：gender = 'men' | 'women' | 'child'；system = 'cm' | 'cn' | 'eu' | 'us' | 'uk'（us/uk 按性别解读，另支持 usM/usW/usK/ukK 显式写法）
function convertBetween(value, system, gender = 'men') {
  if (system === 'usM') return convertBetween(value, 'us', 'men')
  if (system === 'usW') return convertBetween(value, 'us', 'women')
  if (system === 'usK') return convertBetween(value, 'us', 'child')
  if (system === 'ukK') return convertBetween(value, 'uk', 'child')
  const table = gender === 'child' ? CHILD_TABLE : ADULT_TABLE
  let hit = null
  if (system === 'eu') {
    hit = nearestSizeOf(table, value, 'eu') // 欧码 → cm 反查表
  } else {
    const cm = toCmInput(value, system, gender)
    if (cm === null) return null
    hit = nearestSizeOf(table, cm, 'cm')
  }
  if (!hit) return null
  const row = hit.row
  const us = gender === 'women' ? row.usW : gender === 'child' ? row.usK : row.usM
  const uk = gender === 'child' ? row.ukK : row.uk
  return { cm: row.cm, cn: row.cn, eu: row.eu, usM: row.usM, usW: row.usW, usK: row.usK, ukK: row.ukK, us, uk, exact: hit.exact, diff: hit.diff, hint: hit.hint }
}

// ---------- 页面状态 ----------
const activeTab = ref('men') // 'men' | 'women' | 'child'
const inputSystem = ref('cm') // 'cm' | 'cn' | 'eu' | 'us' | 'uk'
const inputValue = ref('25')
const seoContentVisible = ref(true)

const tabMeta = {
  men: { label: '男鞋', gender: 'men', usLabel: '美码 US（男）', ukLabel: '英码 UK' },
  women: { label: '女鞋', gender: 'women', usLabel: '美码 US（女）', ukLabel: '英码 UK' },
  child: { label: '童鞋', gender: 'child', usLabel: '美码 US（童）', ukLabel: '英码 UK（童）' }
}
const tabOptions = [
  { key: 'men', label: '男鞋' },
  { key: 'women', label: '女鞋' },
  { key: 'child', label: '童鞋' }
]

const activeTabMeta = computed(() => tabMeta[activeTab.value])
const activeSystemLabel = computed(() => {
  const opt = systemOptions.value.find((o) => o.key === inputSystem.value)
  return opt ? opt.label : inputSystem.value
})

const systemOptions = computed(() => {
  const meta = tabMeta[activeTab.value]
  return [
    { key: 'cm', label: '脚长（cm）' },
    { key: 'cn', label: '中国码（脚长毫米）' },
    { key: 'eu', label: '欧码 EU' },
    { key: 'us', label: meta.usLabel },
    { key: 'uk', label: meta.ukLabel }
  ]
})

// 当前输入的换算结果（SSR 安全：纯 computed，无浏览器 API）
const result = computed(() => {
  const raw = String(inputValue.value).trim()
  if (!raw) return null
  return convertBetween(raw, inputSystem.value, tabMeta[activeTab.value].gender)
})

// 跨段引导：成人 Tab 输入小于成人段、童鞋 Tab 输入超出童鞋段时提示切换
const rangeHint = computed(() => {
  const raw = String(inputValue.value).trim()
  if (!raw) return null
  const gender = tabMeta[activeTab.value].gender
  const cm = toCmInput(raw, inputSystem.value, gender)
  if (cm === null) return null
  if (gender !== 'child' && cm < FOOT_ADULT_MIN - 0.5) {
    return `该数值折算脚长约 ${fmtSize(cm)} cm，已低于成人对照段下限 ${FOOT_ADULT_MIN}cm，请切换到「童鞋」Tab 查看童鞋码。`
  }
  if (gender === 'child' && cm > FOOT_CHILD_MAX + 0.5) {
    return `该数值折算脚长约 ${fmtSize(cm)} cm，已超出童鞋对照段上限 ${FOOT_CHILD_MAX}cm，请切换到「男鞋」或「女鞋」Tab。`
  }
  return null
})

// 输入制式在结果瓦片中对应的 key（US 按当前 Tab 解读为男/女/童）
const inputTileKey = computed(() => {
  if (inputSystem.value === 'us') {
    return activeTab.value === 'women' ? 'usW' : activeTab.value === 'child' ? 'us' : 'usM'
  }
  return inputSystem.value
})

// 大字结果瓦片：脚长 + 全部制式（成人同屏给男女两个美码）
const resultTiles = computed(() => {
  const r = result.value
  if (!r) return []
  const build = (key, label, value) => ({ key, label, value, input: key === inputTileKey.value })
  if (activeTab.value === 'child') {
    return [
      build('cm', '脚长', `${fmtSize(r.cm)} cm`),
      build('cn', '中国码', fmtSize(r.cn)),
      build('eu', '欧码 EU', fmtSize(r.eu)),
      build('us', '美码 US（童）', fmtSize(r.us)),
      build('uk', '英码 UK（童）', fmtSize(r.uk))
    ]
  }
  return [
    build('cm', '脚长', `${fmtSize(r.cm)} cm`),
    build('cn', '中国码', fmtSize(r.cn)),
    build('eu', '欧码 EU', fmtSize(r.eu)),
    build('usM', '美码 US（男）', fmtSize(r.usM)),
    build('usW', '美码 US（女）', fmtSize(r.usW)),
    build('uk', '英码 UK', fmtSize(r.uk))
  ]
})

// 左侧摘要行：脚长 + 全部口径
const summaryLines = computed(() => {
  const r = result.value
  if (!r) return []
  if (activeTab.value === 'child') {
    return [
      { label: '中国码', value: fmtSize(r.cn), input: inputTileKey.value === 'cn' },
      { label: '欧码 EU', value: fmtSize(r.eu), input: inputTileKey.value === 'eu' },
      { label: '美码 US（童）', value: fmtSize(r.us), input: inputTileKey.value === 'us' },
      { label: '英码 UK（童）', value: fmtSize(r.uk), input: inputTileKey.value === 'uk' }
    ]
  }
  return [
    { label: '中国码', value: fmtSize(r.cn), input: inputTileKey.value === 'cn' },
    { label: '欧码 EU', value: fmtSize(r.eu), input: inputTileKey.value === 'eu' },
    { label: '美码 US（男）', value: fmtSize(r.usM), input: inputTileKey.value === 'usM' },
    { label: '美码 US（女）', value: fmtSize(r.usW), input: inputTileKey.value === 'usW' },
    { label: '英码 UK', value: fmtSize(r.uk), input: inputTileKey.value === 'uk' }
  ]
})

const summaryHint = computed(() => {
  const r = result.value
  if (r) return r.hint
  if (String(inputValue.value).trim()) {
    return rangeHint.value || '未能换算：请输入对照表范围内的数值（成人脚长 21-31cm、欧码 34-49；童鞋脚长 11-21cm、欧码 19-34）。'
  }
  return '尚未输入尺码：选择制式并输入数值后，这里会显示就近档位与偏差提示。'
})

// 对照表（当前 Tab）与输入行高亮
const activeTable = computed(() => (activeTab.value === 'child' ? CHILD_TABLE : ADULT_TABLE))
const tableColumns = computed(() => {
  if (activeTab.value === 'child') {
    return [
      { key: 'cm', label: '脚长 cm', get: (r) => r.cm.toFixed(1) },
      { key: 'cn', label: '中国码', get: (r) => String(r.cn) },
      { key: 'eu', label: '欧码 EU', get: (r) => fmtSize(r.eu) },
      { key: 'us', label: '美码 US（童）', get: (r) => fmtSize(r.usK) },
      { key: 'uk', label: '英码 UK（童）', get: (r) => fmtSize(r.ukK) }
    ]
  }
  return [
    { key: 'cm', label: '脚长 cm', get: (r) => r.cm.toFixed(1) },
    { key: 'cn', label: '中国码', get: (r) => String(r.cn) },
    { key: 'eu', label: '欧码 EU', get: (r) => fmtSize(r.eu) },
    { key: 'usM', label: '美码 US（男）', get: (r) => fmtSize(r.usM) },
    { key: 'usW', label: '美码 US（女）', get: (r) => fmtSize(r.usW) },
    { key: 'uk', label: '英码 UK', get: (r) => fmtSize(r.uk) }
  ]
})
const highlightIndex = computed(() => {
  const r = result.value
  if (!r) return -1
  return activeTable.value.findIndex((row) => row.cm === r.cm)
})

// 量脚指南（静态四步）
const measureSteps = [
  { title: '下午站立体测量', desc: '双脚站立承重后比坐姿、晨间量出的大 0.3-0.5cm（脚会膨胀），下午量最接近真实穿鞋状态，早晨量容易偏小半码。' },
  { title: '脚长 = 脚跟到最长趾', desc: '量脚跟后缘凸点到最长脚趾顶端的直线距离（多数人最长趾是大脚趾，少数人是第二趾），不是鞋垫长、也不是足弓长。' },
  { title: '双脚踏纸描边取大', desc: '纸贴墙、脚跟贴墙站立，笔垂直于纸面描出整脚轮廓，量纵向最远两点；两只脚都要量，按较大的那只选码。' },
  { title: '穿常穿的袜子测量', desc: '运动鞋穿运动袜量、皮鞋穿薄袜量；量完后给脚长加 0.5-1cm 活动余量，再对照本表就近取档。' }
]

// 常用锚点速查（点击自动填入）
const quickPicks = [
  { tab: 'men', system: 'cm', value: '25', label: '男 · 脚长 25.0cm' },
  { tab: 'men', system: 'eu', value: '42', label: '男 · EU 42' },
  { tab: 'men', system: 'us', value: '8', label: '男 · US 8' },
  { tab: 'men', system: 'uk', value: '6.5', label: '男 · UK 6.5' },
  { tab: 'women', system: 'cm', value: '23', label: '女 · 脚长 23.0cm' },
  { tab: 'women', system: 'us', value: '8.5', label: '女 · US 8.5' },
  { tab: 'child', system: 'cm', value: '15', label: '童 · 脚长 15.0cm' },
  { tab: 'child', system: 'eu', value: '25', label: '童 · EU 25' }
]

function applyPick(pick) {
  activeTab.value = pick.tab
  inputSystem.value = pick.system
  inputValue.value = pick.value
}

function fillExample() {
  if (activeTab.value === 'child') {
    inputSystem.value = 'cm'
    inputValue.value = '15'
  } else if (activeTab.value === 'women') {
    inputSystem.value = 'us'
    inputValue.value = '8.5'
  } else {
    inputSystem.value = 'eu'
    inputValue.value = '42'
  }
}

function resetInput() {
  inputSystem.value = 'cm'
  inputValue.value = ''
}

function setTab(key) {
  activeTab.value = key
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('shoe-size-converter')
})
</script>
