<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Container class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">去耦电容配置</h1>
          <p class="text-sm text-muted-foreground mt-1">按芯片类型生成分层去耦配置：每引脚 0.1µF / 芯片级 10µF / 板级大电容，含自谐振频率与安放原则</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        按芯片类型（MCU / FPGA / ADC / 运放 / 功率级）与供电引脚对数，生成「每引脚 0.1µF X7R 0402 + 芯片级 10µF + 板级 47~100µF」的分层去耦配置表并自动合计数量；配套等效阻抗小算：由容值与 ESL 计算自谐振频率 SRF = 1/(2π√(LC))，判断工作频段呈容性还是感性。全部计算在浏览器本地完成，最终以电源完整性仿真与实测纹波为准。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算器 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Layers class="w-5 h-5 mr-2 text-primary" /> 分层去耦配置生成
        </h2>

        <!-- 输入区 -->
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">芯片类型</label>
            <select
              v-model="chipType"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option v-for="(p, key) in CHIP_PRESETS" :key="key" :value="key">{{ p.label }}</option>
            </select>
            <p class="text-xs text-muted-foreground mt-1.5">{{ activePreset.note }}</p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">供电引脚对数（VDD/GND 对）</label>
              <input
                v-model.number="pinPairs"
                type="number"
                min="0"
                step="1"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p class="text-xs text-muted-foreground mt-1.5">数芯片上所有电源引脚对；如 48 脚 MCU 常见 5 对 VDD。每对至少配一颗 0.1µF</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">主频 / 工作频率（MHz）</label>
              <input
                v-model.number="mainFreq"
                type="number"
                min="0"
                step="1"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p class="text-xs text-muted-foreground mt-1.5">选型联动：主频越高，对封装电感与高频档的要求越高</p>
            </div>
          </div>
        </div>

        <!-- 配置表 -->
        <div v-if="config" class="space-y-3">
          <div class="rounded-lg border border-border overflow-hidden">
            <div class="grid grid-cols-12 bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
              <div class="col-span-3">层级</div>
              <div class="col-span-5">规格</div>
              <div class="col-span-2 text-right">数量</div>
              <div class="col-span-2 text-right">小计容值</div>
            </div>
            <div v-for="(row, i) in config.rows" :key="i" class="grid grid-cols-12 px-4 py-2.5 text-sm border-t border-border/50 items-center">
              <div class="col-span-3 text-foreground font-medium">{{ row.layer }}</div>
              <div class="col-span-5 text-muted-foreground">{{ row.spec }}</div>
              <div class="col-span-2 text-right text-foreground font-semibold">×{{ row.count }}</div>
              <div class="col-span-2 text-right text-muted-foreground">{{ fmt(row.count * row.capUF, 1) }} µF</div>
            </div>
            <div class="grid grid-cols-12 px-4 py-3 text-sm border-t border-border bg-primary/5 items-center">
              <div class="col-span-8 text-foreground font-semibold">合计（{{ config.totalCaps }} 颗）</div>
              <div class="col-span-4 text-right text-primary font-bold">{{ fmt(config.totalUF, 1) }} µF</div>
            </div>
          </div>

          <div v-if="freqNote" :class="['rounded-lg p-4 text-sm leading-relaxed', freqNote.cls]">
            <p class="font-medium mb-1">高频适配提示（主频 {{ fmt(mainFreq, 0) }}MHz）</p>
            <p class="text-muted-foreground">{{ freqNote.text }}</p>
          </div>

          <button
            @click="copyResult"
            class="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            <Clipboard class="w-3.5 h-3.5" /> 复制配置清单
          </button>
        </div>
        <div v-else class="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          请输入有效的供电引脚对数。
        </div>

        <!-- 频段-阻抗注记 -->
        <div class="border-t border-border/50 pt-4">
          <h3 class="text-sm font-medium text-foreground mb-2 flex items-center">
            <TrendingDown class="w-4 h-4 mr-1.5 text-primary" /> 频段-阻抗注记（按本配置各层 ESL 估算）
          </h3>
          <div class="space-y-2">
            <div class="flex gap-3 items-start p-3 bg-muted/50 rounded-lg text-sm">
              <span class="font-mono text-xs text-muted-foreground whitespace-nowrap mt-0.5">DC ~ {{ fmt(bulkSrf, 2) }}MHz</span>
              <span class="text-muted-foreground">板级大电容主导：负责储能与低频纹波，关键参数是 ESR 与容量而非频率响应</span>
            </div>
            <div class="flex gap-3 items-start p-3 bg-muted/50 rounded-lg text-sm">
              <span class="font-mono text-xs text-muted-foreground whitespace-nowrap mt-0.5">~ {{ fmt(chipSrf, 2) }}MHz</span>
              <span class="text-muted-foreground">芯片级 10µF 主导：中频段过渡，补大电容高频不足与 0.1µF 低频不足之间的谷</span>
            </div>
            <div class="flex gap-3 items-start p-3 bg-muted/50 rounded-lg text-sm">
              <span class="font-mono text-xs text-muted-foreground whitespace-nowrap mt-0.5">~ {{ fmt(pinSrf, 2) }}MHz</span>
              <span class="text-muted-foreground">0.1µF 低阻抗窗口：主去耦频段，快速瞬态电流由此就近提供</span>
            </div>
            <div class="flex gap-3 items-start p-3 bg-muted/50 rounded-lg text-sm">
              <span class="font-mono text-xs text-muted-foreground whitespace-nowrap mt-0.5">&gt; {{ fmt(pinSrf, 2) }}MHz</span>
              <span class="text-muted-foreground">封装电感主导：0.1µF 已呈感性，靠电源-地平面电容与小封装（0402/0201）多档并联拉宽带宽</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 自谐振小算 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-base font-semibold text-foreground mb-3 flex items-center">
            <Activity class="w-4 h-4 mr-2 text-primary" /> 等效阻抗小算 · 自谐振频率
          </h2>
          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-medium text-foreground mb-1.5">容值 C（nF）</label>
                <input
                  v-model.number="srfC"
                  type="number"
                  min="0"
                  step="10"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-foreground mb-1.5">ESL（nH）</label>
                <input
                  v-model.number="srfL"
                  type="number"
                  min="0"
                  step="0.1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-foreground mb-1.5">核查频率 f（MHz，可选）</label>
              <input
                v-model.number="srfF"
                type="number"
                min="0"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div v-if="srfRes" class="bg-primary/10 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">SRF = 1 / (2π√(LC))</p>
              <p class="text-3xl font-bold text-primary">{{ fmt(srfRes.srfMHz, 2) }} <span class="text-base">MHz</span></p>
              <p v-if="srfRes.regime === 'cap'" class="text-xs text-foreground mt-2">f={{ fmt(srfF, 2) }}MHz：容性区，|Z|≈{{ fmt(srfRes.zOhm, 2) }}Ω，正常去耦</p>
              <p v-else-if="srfRes.regime === 'res'" class="text-xs text-foreground mt-2">f={{ fmt(srfF, 2) }}MHz：谐振区附近，阻抗最低（≈ESR，mΩ 级），去耦效果最佳</p>
              <p v-else class="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">f={{ fmt(srfF, 2) }}MHz：已超过 SRF，电容呈感性（|Z|≈{{ fmt(srfRes.zOhm, 2) }}Ω），去耦作用失效</p>
              <p class="text-[10px] text-muted-foreground mt-1.5">超过 SRF 呈感性；等效 ESL：0402 约 0.5nH、0805 约 1nH、电解/大容量约 5nH</p>
            </div>
            <div v-else class="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground text-center">
              请输入大于 0 的容值与 ESL。
            </div>
          </div>
        </div>

        <!-- 布局三原则 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-base font-semibold text-foreground mb-3 flex items-center">
            <CircuitBoard class="w-4 h-4 mr-2 text-primary" /> 布局三原则
          </h2>
          <div class="space-y-3 text-sm">
            <div class="flex gap-2.5 items-start">
              <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">1</span>
              <div>
                <p class="text-foreground font-medium">贴近引脚</p>
                <p class="text-xs text-muted-foreground">0.1µF 距电源引脚越近越好（<2mm 量级），电流先过电容再到芯片，别让走线把电容"甩"在支路上。</p>
              </div>
            </div>
            <div class="flex gap-2.5 items-start">
              <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">2</span>
              <div>
                <p class="text-foreground font-medium">环路最小</p>
                <p class="text-xs text-muted-foreground">电容-引脚-地的回路面积决定等效电感，电源脚与地脚同侧就近打地过孔，回流路径同层闭合。</p>
              </div>
            </div>
            <div class="flex gap-2.5 items-start">
              <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">3</span>
              <div>
                <p class="text-foreground font-medium">过孔优先</p>
                <p class="text-xs text-muted-foreground">电容焊盘就近双过孔入地平面优于任何长走线；先过孔后拉线，过孔打在焊盘上（via-in-pad）最优。</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 快速自核示例 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-base font-semibold text-foreground mb-3 flex items-center">
            <FlaskConical class="w-4 h-4 mr-2 text-primary" /> 快速自核示例
          </h2>
          <div class="space-y-2">
            <button
              @click="loadExample('config')"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              配置：MCU 32位、5 对 VDD → 0.1µF×5 + 10µF×1 + 47µF×1，合计 <span class="text-foreground font-medium">7 颗 / 57.5µF</span>
            </button>
            <button
              @click="loadExample('srf')"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              自谐振：C=100nF、ESL=0.5nH → SRF ≈ <span class="text-foreground font-medium">22.51MHz</span>（ESL=1nH 时约 15.92MHz）
            </button>
          </div>
        </div>

        <!-- 免责声明 -->
        <div class="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p class="text-xs text-muted-foreground leading-relaxed">
            本工具按典型 ESL 与经验配比快速估算，实际阻抗还受 ESR、直流偏压降容、温度与平面形状影响。关键设计请以 PI 仿真（阻抗曲线目标法）与实测电源纹波为准。
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
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-8">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>去耦电容配置原理与用法</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <h3 class="text-lg font-semibold text-foreground">0.1µF 从哪来：为什么是它而不是别的值</h3>
          <p>
            0.1µF 不是魔法数字，而是「容值 × 自谐振频率 × 成本」折中的历史产物。X7R 0402 的 0.1µF 配上约 0.5nH 封装电感，自谐振频率恰在 20~30MHz——正好覆盖 MCU IO 翻转与多数芯片内核瞬态的主频段；再往上（100MHz 以上）它已经呈感性，靠的不是更大容值而是更小封装与平面电容。同时 0.1µF 在常用容值档里单价最低、可一颗颗贴满每个电源脚。容值-频率-ESL 的关系可用本页侧栏的自谐振小算验证，术语细节参见 <NuxtLink to="/wiki/decoupling-capacitor/" class="text-primary hover:underline">去耦电容词条</NuxtLink>。
          </p>
          <h3 class="text-lg font-semibold text-foreground">去耦电容不是越大越好</h3>
          <p>
            大容值意味着低自谐振频率与更大封装（更高 ESL）：一颗 10µF 0805 的 SRF 只有 1~2MHz，在 50MHz 下它是感性开路，帮不上任何忙。去耦的目标是「在需要的频段把电源阻抗压到目标值以下」，所以要用小容值覆盖高频、中容值补过渡、大容值管储能的分层组合——每层各管一段频谱，并联起来拉宽低阻抗区间。把 0.1µF 全换成 10µF，高频纹波反而会更差。
          </p>
          <h3 class="text-lg font-semibold text-foreground">平面电容：GHz 段的最后防线</h3>
          <p>
            电源平面与地平面构成的平行板电容没有引线电感，其"自谐振"频率极高，是 100MHz~1GHz 频段唯一可靠的去耦手段。缩小两平面间距（层压 0.1mm 以内）、加大重叠面积都能提升平面电容；这也是高速板把电源-地对紧耦合布置的直接原因。当芯片封装内已集成电源平面（如 BGA 内部电容、IPD）时，板上离散电容的压力会小很多。
          </p>
          <h3 class="text-lg font-semibold text-foreground">去耦 vs 旁路：一字之差</h3>
          <p>
            去耦（decoupling）指把芯片与电源系统"解耦"：在芯片引脚就近提供瞬态电流蓄水池，让开关噪声留在局部回路而不污染整个电源轨；旁路（bypass）指把噪声分流到地，让电源上的高频分量绕过负载。同一个 0.1µF 电容两种角色都在扮演——对电源轨它是旁路（把噪声导到地），对芯片它是去耦（就近供能）。工程口语里两词常混用，配置方法一致。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">为什么每个电源引脚都要一颗 0.1µF？</span>瞬态电流必须就近取用，走线每毫米都在加电感；两引脚共用一颗等于把环路拉长一倍，高频去耦效果大打折扣。</li>
            <li><span class="text-foreground font-medium">板级大电容选电解还是固态？</span>优先低 ESR 固态/钽；电解便宜但 ESR 高、寿命受温度影响，适合低成本消费类。容量按最坏瞬态持续时间 × 允许压降估算。</li>
            <li><span class="text-foreground font-medium">X7R 的直流偏压降容要不要管？</span>要。0.1µF X7R 0402 在 3.3V 偏压下实际容量可能只剩 60~80%，关键场合按降容后的容值核算 SRF，或选大一档/换 C0G。</li>
            <li><span class="text-foreground font-medium">0.1µF、10µF、47µF 距离芯片多远合适？</span>0.1µF 必须 <2mm 量级贴着引脚；10µF 可放宽到 1~2cm；板级大电容只管储能，放电源入口即可。</li>
          </ul>
          <p class="text-xs pt-2 border-t border-border/50">本工具为快速估算，实际以 PI 仿真与实测纹波为准。</p>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'decoupling-cap'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Container, Layers, Activity, CircuitBoard, TrendingDown, FlaskConical, AlertTriangle, Clipboard, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '去耦电容配置 - 分层去耦与自谐振频率计算 | Util工具箱',
  description: '在线去耦电容配置工具：按芯片类型与供电引脚对数生成分层配置表（每引脚 0.1µF X7R 0402 + 芯片级 10µF + 板级 47~100µF）并自动合计，含 SRF 自谐振频率计算、频段-阻抗注记与布局三原则，纯本地计算',
  keywords: '去耦电容配置, 0.1uF, 去耦电容选择, 自谐振频率, SRF计算, 退耦电容, 旁路电容, 电源完整性, decoupling capacitor, 电容ESL',
  author: 'Util工具箱',
  ogTitle: '去耦电容配置 - 分层去耦与自谐振频率计算',
  ogDescription: '按芯片类型生成 0.1µF/10µF/大电容分层去耦配置，SRF 自谐振小算与布局三原则',
  ogUrl: 'https://www.util.cn/tools/decoupling-cap',
  ogType: 'website',
  twitterCard: 'summary_large_image'
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
          name: '去耦电容配置',
          url: 'https://www.util.cn/tools/decoupling-cap',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['分层去耦配置表生成', '数量与容值自动合计', '自谐振频率 SRF 计算', '频段-阻抗注记', '容性/感性区判定', '布局三原则清单']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: '去耦电容配置', item: 'https://www.util.cn/tools/decoupling-cap' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么去耦电容常用 0.1µF？',
              acceptedAnswer: { '@type': 'Answer', text: '0.1µF X7R 0402 配约 0.5nH 封装电感的自谐振频率在 20~30MHz，恰覆盖多数芯片瞬态主频段，且单价低、可每引脚一颗，是容值-频率-成本折中的结果。' }
            },
            {
              '@type': 'Question',
              name: '去耦电容是不是越大越好？',
              acceptedAnswer: { '@type': 'Answer', text: '不是。容值越大自谐振频率越低、封装电感越大，高频段反而呈感性失效；正确做法是小容值管高频、中容值补过渡、大容值管储能的分层组合。' }
            },
            {
              '@type': 'Question',
              name: '去耦和旁路有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '去耦指在芯片引脚就近提供瞬态电流、把噪声隔离在局部回路；旁路指把电源上的高频噪声分流到地。同一颗电容两种角色都在扮演，配置方法一致。' }
            },
            {
              '@type': 'Question',
              name: '超过自谐振频率会怎样？',
              acceptedAnswer: { '@type': 'Answer', text: '电容在 SRF 处阻抗最低（≈ESR），超过 SRF 后呈感性，频率越高阻抗越大，去耦作用失效；高频段依靠平面电容与小封装电容。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'decoupling-cap'
const STORE_KEY = TOOL_ID + ':inputs'
const tool = tools.find(t => t.id === TOOL_ID)

// ===== PURE-FNS-START（节点单测按标记抽取本段执行；保持自包含，勿引用外部变量）=====
// 芯片类型预设：默认引脚对数、芯片级 10µF 数量、板级大电容、默认主频
const CHIP_PRESETS = {
  mcu8: { label: 'MCU · 8位（STM8/8051 等）', pairs: 2, chipCount: 1, bulkUF: 47, freq: 16, note: '时钟频率低，重点是每对 VDD 一颗 0.1µF，电机/继电器负载时加大板级电容。' },
  mcu32: { label: 'MCU · 32位（STM32/GD32 等）', pairs: 5, chipCount: 1, bulkUF: 47, freq: 168, note: '内核瞬态快，0.1µF 必须贴脚；多电源域（VDD/VADD/VDDA）各自独立配置。' },
  fpga: { label: 'FPGA / SoC', pairs: 8, chipCount: 2, bulkUF: 100, freq: 100, note: '电源轨多且瞬态大：每轨独立 0.1µF 群 + 芯片级 10µF×2，建议再补 1~4.7µF 中间层，内核轨重点关照。' },
  adc: { label: 'ADC / 高精度模拟', pairs: 2, chipCount: 1, bulkUF: 47, freq: 25, note: '模拟/参考供电独立去耦：AVDD 与 VREF 各 0.1µF+10µF，必要时磁珠 + 低 ESR 钽隔离数字噪声。' },
  opamp: { label: '运放 / 模拟前端', pairs: 1, chipCount: 1, bulkUF: 47, freq: 10, note: '双电源正负轨各自 0.1µF+10µF 靠近电源引脚，音频以上频段注意电容自身压电噪声。' },
  power: { label: '功率级 / 栅极驱动', pairs: 1, chipCount: 2, bulkUF: 100, freq: 500, note: '大电流环路优先：陶瓷紧贴 + 固态/电解储能，注意电容纹波电流额度与自发热。' }
}

// 各层级等效 ESL（nH）：0402 约 0.5、0805 约 1、大容量电解/固态约 5
const LAYER_ESL = { pin: 0.5, chip: 1, bulk: 5 }

// 自谐振频率 SRF = 1/(2π√(LC))，cNF 单位 nF、lNH 单位 nH，返回 MHz
const srfMHz = (cNF, lNH) => {
  const l = lNH * 1e-9
  const c = cNF * 1e-9
  return 1 / (2 * Math.PI * Math.sqrt(l * c)) / 1e6
}

// 指定频率下的等效阻抗与区间判定，fMHz 单位 MHz
const capImpedance = (cNF, lNH, fMHz) => {
  const c = cNF * 1e-9
  const l = lNH * 1e-9
  const f = fMHz * 1e6
  const xc = 1 / (2 * Math.PI * f * c)
  const xl = 2 * Math.PI * f * l
  const srf = 1 / (2 * Math.PI * Math.sqrt(l * c))
  const z = Math.abs(xl - xc)
  let regime = 'cap'
  if (f > srf * 1.05) regime = 'ind'
  else if (f >= srf * 0.95) regime = 'res'
  return { xc, xl, zOhm: z, srfMHz: srf / 1e6, regime }
}

// 分层配置表：typeKey 芯片类型、pairs 供电引脚对数
const buildLayers = (typeKey, pairs) => {
  const p = CHIP_PRESETS[typeKey] || CHIP_PRESETS.mcu32
  const n = pairs > 0 && isFinite(pairs) ? Math.floor(pairs) : p.pairs
  return {
    rows: [
      { layer: '每引脚去耦', spec: '0.1µF X7R 0402（C0G/X7R，贴脚安放）', count: n, capUF: 0.1 },
      { layer: '芯片级储能', spec: '10µF X7R/X5R 0805（靠近芯片居中）', count: p.chipCount, capUF: 10 },
      { layer: '板级储能', spec: p.bulkUF + 'µF 固态/钽/电解（电源入口）', count: 1, capUF: p.bulkUF }
    ],
    totalCaps: n + p.chipCount + 1,
    totalUF: n * 0.1 + p.chipCount * 10 + p.bulkUF
  }
}

// 各层自谐振频率（nF, nH → MHz），用于频段-阻抗注记
const layerSrfMHz = (layerKey, bulkUF) => {
  if (layerKey === 'pin') return srfMHz(100, LAYER_ESL.pin)
  if (layerKey === 'chip') return srfMHz(10000, LAYER_ESL.chip)
  return srfMHz(bulkUF * 1000, LAYER_ESL.bulk)
}

// 主频联动的高频适配提示
const freqNote = (freqMHz) => {
  if (!(freqMHz > 0) || !isFinite(freqMHz)) return null
  if (freqMHz <= 20) {
    return { key: 'low', text: '主频落在 0.1µF 0402 的低阻抗窗口内（SRF 约 22.5MHz），常规分层配置即可，无需额外高频档。' }
  }
  if (freqMHz <= 100) {
    return { key: 'mid', text: '主频已接近/进入 0.1µF 0402 的自谐振区（约 22.5MHz）：优先选小封装贴近引脚，建议每电源域再补 1nF/10nF 高频档，并确认地过孔就近。' }
  }
  if (freqMHz <= 300) {
    return { key: 'high', text: '封装电感开始主导（0.1µF 已呈感性）：高频段主要依靠电源-地平面电容，选 0402/0201 小封装、增加 1nF+10nF+100nF 多档并联拉宽带宽，IC 供电引脚内侧铺电源岛。' }
  }
  return { key: 'vhigh', text: '数百 MHz 以上频段离散电容基本失效：依赖平面电容（电源地紧耦合、层间距 ≤0.1mm）与封装内电容（IPD/ Die 电容），0201 小电容贴近仅作补充，务必做 PI 仿真验证。' }
}
// ===== PURE-FNS-END =====

// ---------- 状态 ----------
const chipType = ref('mcu32')
const pinPairs = ref(5)
const mainFreq = ref(168)
const srfC = ref(100)
const srfL = ref(0.5)
const srfF = ref(1)

// 类型切换时联动默认引脚对数与主频（选型联动）
watch(chipType, (key) => {
  const p = CHIP_PRESETS[key]
  if (p) {
    pinPairs.value = p.pairs
    mainFreq.value = p.freq
  }
})

// 交互记录与输入持久化（SSR 安全：localStorage 仅在客户端执行）
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORE_KEY) : null
    if (raw) {
      const s = JSON.parse(raw)
      if (typeof s.chipType === 'string' && CHIP_PRESETS[s.chipType]) chipType.value = s.chipType
      if (typeof s.pinPairs === 'number') pinPairs.value = s.pinPairs
      if (typeof s.mainFreq === 'number') mainFreq.value = s.mainFreq
      if (typeof s.srfC === 'number') srfC.value = s.srfC
      if (typeof s.srfL === 'number') srfL.value = s.srfL
      if (typeof s.srfF === 'number') srfF.value = s.srfF
    }
  } catch (e) { /* 忽略恢复失败 */ }
})

const persist = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      chipType: chipType.value, pinPairs: pinPairs.value, mainFreq: mainFreq.value,
      srfC: srfC.value, srfL: srfL.value, srfF: srfF.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
}
watch([chipType, pinPairs, mainFreq, srfC, srfL, srfF], persist)

const num = (v) => (typeof v === 'number' && isFinite(v) ? v : NaN)

// ---------- 数字格式化（避免浮点尾差） ----------
const fmt = (v, digits = 2) => {
  if (typeof v !== 'number' || !isFinite(v)) return '—'
  return Number(v.toFixed(digits)).toLocaleString('zh-CN', { maximumFractionDigits: digits })
}

const activePreset = computed(() => CHIP_PRESETS[chipType.value] || CHIP_PRESETS.mcu32)

// ---------- 配置表 ----------
const config = computed(() => {
  const n = num(pinPairs.value)
  if (!(n > 0)) return null
  return buildLayers(chipType.value, n)
})

// ---------- 高频适配提示 ----------
const freqNoteRes = computed(() => freqNote(num(mainFreq.value)))

// ---------- 各层 SRF（频段-阻抗注记） ----------
const pinSrf = computed(() => layerSrfMHz('pin'))
const chipSrf = computed(() => layerSrfMHz('chip'))
const bulkSrf = computed(() => layerSrfMHz('bulk', activePreset.value.bulkUF))

// ---------- 自谐振小算 ----------
const srfRes = computed(() => {
  const c = num(srfC.value), l = num(srfL.value), f = num(srfF.value)
  if (!(c > 0) || !(l > 0)) return null
  const r = capImpedance(c, l, f > 0 ? f : 0.000001)
  return { srfMHz: r.srfMHz, zOhm: r.zOhm, regime: r.regime }
})

// ---------- 交互 ----------
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const loadExample = (kind) => {
  if (kind === 'config') {
    chipType.value = 'mcu32'
    pinPairs.value = 5
    mainFreq.value = 168
  } else {
    srfC.value = 100
    srfL.value = 0.5
    srfF.value = 1
  }
}

const copyResult = async () => {
  if (!config.value) { alert('当前输入不完整，无法复制'); return }
  const lines = []
  lines.push('【去耦电容配置】')
  lines.push('芯片类型：' + activePreset.value.label + '，供电引脚对数：' + fmt(pinPairs.value, 0) + '，主频：' + fmt(mainFreq.value, 0) + 'MHz')
  for (const row of config.value.rows) {
    lines.push(row.layer + '：' + row.spec + ' ×' + row.count)
  }
  lines.push('合计：' + config.value.totalCaps + ' 颗 / ' + fmt(config.value.totalUF, 1) + 'µF')
  if (freqNoteRes.value) lines.push('高频适配提示：' + freqNoteRes.value.text)
  lines.push('布局三原则：贴近引脚 / 环路最小 / 过孔优先')
  lines.push('—— 来自 Util工具箱·去耦电容配置')
  try {
    await navigator.clipboard.writeText(lines.join('\n'))
    alert('已复制到剪贴板')
  } catch (e) {
    alert('复制失败，请手动选择文本复制')
  }
}
</script>
