<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <HardDrive class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">数据存储单位换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">bit 到 YB：十进制（×1000）与二进制（×1024）双体系并列换算，看懂 1 TB 为什么显示 931 GiB</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线数据存储单位换算工具：bit、B、KB/MB/GB/TB/PB/EB/ZB/YB（十进制 SI 体系，每级 10³）与
        KiB/MiB/GiB/TiB/PiB/EiB/ZiB/YiB（二进制 IEC 体系，每级 2¹⁰）双体系并列换算，任一单位输入、双列结果实时联动；
        附「当前值与全部 18 个单位的完整精度换算关系」明细展开、单位因子明细表（精确定义 × 同级对侧换算）。
        硬盘标称 1 TB 系统只显示约 931 GiB、100 M 宽带下载峰值只有 12.5 MB/s、8 bit = 1 B——十进制与二进制的口径差异与
        宽带 Mb/s 的 bit 字节之辨，见下方科普。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 输入卡 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <HardDrive class="w-5 h-5 mr-2 text-primary" /> 输入容量
        </h2>

        <div>
          <label class="text-xs text-muted-foreground">选择来源单位</label>
          <select
            v-model="inputUnit"
            class="mt-1 w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <optgroup label="十进制体系（SI，每级 ×1000）">
              <option v-for="u in DECIMAL_UNITS" :key="u.id" :value="u.id">{{ u.symbol }} — {{ u.name }}</option>
            </optgroup>
            <optgroup label="二进制体系（IEC，每级 ×1024）">
              <option v-for="u in BINARY_ONLY_UNITS" :key="u.id" :value="u.id">{{ u.symbol }} — {{ u.name }}</option>
            </optgroup>
          </select>
        </div>

        <div>
          <label class="text-xs text-muted-foreground">输入数值</label>
          <input
            v-model="inputValue"
            type="number"
            min="0"
            step="any"
            placeholder="输入数值，如 1"
            class="mt-1 w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p class="text-[10px] text-muted-foreground mt-1.5 flex items-start gap-1.5">
            <TriangleAlert class="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>b = bit（位），B = Byte（字节），8 bit = 1 B。电信宽带说的「100 M」是 100 Mb/s（兆比特每秒）：1 Mb/s = 0.125 MB/s，理论下载峰值 12.5 MB/s。</span>
          </p>
        </div>

        <p v-if="parsed === null" class="text-xs text-muted-foreground p-2.5 rounded bg-muted/40">
          请输入非负数值，双体系换算结果将实时联动。
        </p>

        <div class="flex flex-wrap gap-2">
          <button
            @click="swapUnits"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition flex items-center gap-1.5"
          >
            <ArrowLeftRight class="w-3 h-3" /> 互换 {{ currentUnit.symbol }} ⇄ {{ swapTargetUnit.symbol }}
          </button>
          <button
            @click="applyPreset(1, 'TB')"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition"
          >
            <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 预设 1 TB
          </button>
          <button
            @click="applyPreset(1, 'GIB')"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition"
          >
            <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 预设 1 GiB
          </button>
          <button
            @click="applyPreset(8, 'bit')"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition"
          >
            <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 预设 8 bit
          </button>
          <button
            @click="resetInput"
            class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition"
          >
            <RefreshCw class="w-3 h-3 inline mr-1 -mt-0.5" /> 清空
          </button>
        </div>

        <!-- 常用速查卡 -->
        <div class="border-t border-border pt-4">
          <p class="text-sm font-medium text-foreground mb-2">常见容量速查（点击载入）</p>
          <div class="grid grid-cols-1 gap-1.5">
            <button
              v-for="q in quickRows"
              :key="'q' + q.v + q.unit"
              @click="applyPreset(q.v, q.unit)"
              class="w-full px-2 py-1 rounded-md bg-muted/40 border border-border text-[11px] font-mono text-foreground hover:border-primary/40 transition text-center"
            >
              {{ q.text }}
            </button>
          </div>
        </div>
      </div>

      <!-- 结果双列（占两列） -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold flex items-center">
              <HardDrive class="w-5 h-5 mr-2 text-primary" /> 双体系换算结果
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

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- 十进制列 -->
            <div>
              <p class="text-xs font-semibold text-muted-foreground mb-2">十进制体系（SI · 每级 ×1000）</p>
              <div class="space-y-1.5">
                <div
                  v-for="r in decimalRows"
                  :key="r.id"
                  class="flex items-center justify-between px-3 py-2 rounded-lg border"
                  :class="r.id === inputUnit ? 'bg-primary/10 border-primary/40' : 'bg-muted/40 border-border'"
                >
                  <div class="min-w-0">
                    <p class="text-xs font-semibold text-foreground">{{ r.symbol }}
                      <span v-if="r.id === inputUnit" class="ml-1 text-[10px] font-normal text-primary">输入</span>
                    </p>
                    <p class="text-[10px] text-muted-foreground truncate">{{ r.name }}</p>
                  </div>
                  <p class="text-lg font-bold font-mono text-right" :class="r.id === inputUnit ? 'text-primary' : 'text-foreground'">
                    {{ r.value === null ? '—' : fmtData(r.value) }}
                  </p>
                </div>
              </div>
            </div>
            <!-- 二进制列 -->
            <div>
              <p class="text-xs font-semibold text-muted-foreground mb-2">二进制体系（IEC · 每级 ×1024）</p>
              <div class="space-y-1.5">
                <div
                  v-for="r in binaryRows"
                  :key="r.id"
                  class="flex items-center justify-between px-3 py-2 rounded-lg border"
                  :class="r.id === inputUnit ? 'bg-primary/10 border-primary/40' : 'bg-muted/40 border-border'"
                >
                  <div class="min-w-0">
                    <p class="text-xs font-semibold text-foreground">{{ r.symbol }}
                      <span v-if="r.id === inputUnit" class="ml-1 text-[10px] font-normal text-primary">输入</span>
                    </p>
                    <p class="text-[10px] text-muted-foreground truncate">{{ r.name }}</p>
                  </div>
                  <p class="text-lg font-bold font-mono text-right" :class="r.id === inputUnit ? 'text-primary' : 'text-foreground'">
                    {{ r.value === null ? '—' : fmtData(r.value) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- 明细展开：当前值与各单位的换算关系 -->
          <details v-if="canCopy" class="mt-4 border border-border rounded-lg">
            <summary class="px-3 py-2 text-xs font-medium text-primary cursor-pointer select-none">
              换算明细：当前值与各单位的完整精度关系（点开查看）
            </summary>
            <div class="px-3 pb-3 pt-1 space-y-2">
              <p class="text-xs font-mono text-foreground leading-relaxed">
                {{ bytesFullLine }}
              </p>
              <p class="text-xs text-muted-foreground leading-relaxed">
                {{ sameLevelLine }}
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                <p v-for="line in detailLines" :key="line" class="text-[11px] font-mono text-muted-foreground leading-relaxed">{{ line }}</p>
              </div>
            </div>
          </details>

          <p class="text-xs text-muted-foreground mt-4 leading-relaxed">
            因子：1 KB = 10³ B、1 KiB = 2¹⁰ B = 1024 B，两体系每级分别 ×1000 与 ×1024。
            锚点：1 TB = 1000 GB = 931.3226 GiB（10¹² ÷ 2³⁰）；8 bit = 1 B；1 MiB = 1.048576 MB；
            1 GiB = 1.073741824 GB；1 GB = 0.9313 GiB = 953.6743 MiB。
          </p>
        </div>
      </div>
    </div>

    <!-- 页面说明条 -->
    <div class="bg-muted/40 border border-border rounded-lg px-4 py-3 mb-6 flex items-start gap-2">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        双体系由来：硬盘、U 盘、光盘厂商按十进制（SI）标容量（1 TB = 10¹² B）；
        操作系统按内存二进制寻址习惯以 2¹⁰ 进位显示（1 TiB = 1 099 511 627 776 B），所以 1 TB 硬盘在 Windows 里显示约「931 GB」（实为 GiB）——
        不是缺斤短两，是口径不同。1998 年 IEC 引入 KiB/MiB/GiB 记法区分两体系；Windows 至今仍把 GiB 标成「GB」，macOS 自 10.6 起改按十进制显示。
        内存（RAM）从来按二进制标称：8 GB 内存条实为 8 GiB。
      </p>
    </div>

    <!-- 场景参考表 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-lg font-semibold flex items-center mb-1">
        <HardDrive class="w-5 h-5 mr-2 text-primary" /> 常见载体容量对照（点击行载入换算）
      </h2>
      <p class="text-xs text-muted-foreground mb-4">标称值均按厂商口径（十进制）输入；「≈ 对侧」列展示换到另一体系最近单位的读数差。</p>

      <div class="overflow-x-auto">
        <div class="min-w-[680px]">
          <div class="grid grid-cols-[1.3fr_0.8fr_1.1fr_2fr] gap-2 px-3 py-2 text-[11px] font-medium text-muted-foreground border-b border-border">
            <span>载体</span><span>标称容量</span><span>≈ 对侧口径</span><span>说明</span>
          </div>
          <button
            v-for="row in scenarioRows"
            :key="row.name"
            @click="loadScenario(row)"
            class="w-full grid grid-cols-[1.3fr_0.8fr_1.1fr_2fr] gap-2 px-3 py-2.5 text-left text-xs border-b border-border/60 hover:bg-primary/5 transition items-center"
          >
            <span class="font-medium text-foreground">{{ row.name }}</span>
            <span class="font-mono text-foreground">{{ row.valueText }}</span>
            <span class="font-mono text-muted-foreground">{{ row.oppositeText }}</span>
            <span class="text-muted-foreground leading-snug">{{ row.note }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 单位因子明细表 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-lg font-semibold flex items-center mb-1">
        <HardDrive class="w-5 h-5 mr-2 text-primary" /> 单位因子明细表（精确定义 × 同级对侧换算）
      </h2>
      <p class="text-xs text-muted-foreground mb-4">每级 ×1000（SI）与 ×1024（IEC）的差距随级别扩大：KiB 比 KB 大 2.4%，TiB 比 TB 大 9.95%，YiB 比 YB 大约 20.9%。</p>

      <div class="overflow-x-auto">
        <div class="min-w-[720px]">
          <div class="grid grid-cols-[0.6fr_1.4fr_1.2fr_1.6fr] gap-2 px-3 py-2 text-[11px] font-medium text-muted-foreground border-b border-border">
            <span>单位</span><span>精确定义</span><span>同级对侧换算</span><span>体系与常见场景</span>
          </div>
          <div
            v-for="row in factorRows"
            :key="row.id"
            class="grid grid-cols-[0.6fr_1.4fr_1.2fr_1.6fr] gap-2 px-3 py-2.5 text-left text-xs border-b border-border/60 items-center"
          >
            <span class="font-semibold text-foreground font-mono">{{ row.symbol }}</span>
            <span class="font-mono text-foreground">{{ row.factorText }}</span>
            <span class="font-mono text-muted-foreground">{{ row.pairText }}</span>
            <span class="text-muted-foreground leading-snug">{{ row.note }}</span>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>硬盘 1TB 为什么只显示 931GB？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          因为容量有两套进位体系。硬盘厂商按十进制（SI）标称：1 TB = 10¹² 字节 = 1 000 000 000 000 B；
          而 Windows 等系统按二进制习惯以 2³⁰（GiB）为单位读它：10¹² ÷ 2³⁰ ≈ 931.32——系统把这个数标成「931 GB」，
          单位名沿用了 GB，实际口径却是 GiB。1 TB ÷ 2⁴⁰ ≈ 909.49 TiB 亦同。差额约 7% 来自进制差，不是「缺斤短两」，
          也与坏块预留（备件扇区）无关。32 GB U 盘显示约 29.8「GB」（29.8 GiB）、1 TB 移动硬盘显示 931 GB，都是同一件事。
          苹果 macOS 自 10.6 起改按十进制显示，所以同一块盘在 Mac 上反而「显得更大」。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">GB 和 GiB 到底差多少？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          每一级差 2.4%（1024/1000），级别越高累积越大：1 KiB = 1.024 KB；1 MiB = 1.048576 MB（+4.86%）；
          1 GiB = 1.073741824 GB（+7.37%）；1 TiB = 1.099511627776 TB（+9.95%）；到 1 YiB = 1.2089 × 10²⁴ B，比 1 YB 大约 20.9%。
          实用口径：内存（RAM）从诞生起就按二进制标，「8 GB 内存」实为 8 GiB，无人受损；硬盘、光盘、U 盘、存储卡按十进制标；
          文件大小（资源管理器、下载工具）显示的是二进制口径但写成 KB/MB/GB。上传下载速度则按十进制（网络设备惯例）。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">100M 宽带为什么下载只有 12.5 MB/s？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          运营商的「M」是 Mb/s（兆比特每秒，bit），下载软件显示的是 MB/s（兆字节每秒，Byte），而 8 bit = 1 Byte：
          100 Mb/s ÷ 8 = 12.5 MB/s，这是理论峰值；再扣掉 TCP/IP 协议头与拥塞控制开销（约 5-10%），实测 11 MB/s 上下属正常。
          千兆宽带 1000 Mb/s ≈ 125 MB/s 理论峰值。同理「300M 宽带」≈ 37.5 MB/s。换算口径：1 Mb/s = 0.125 MB/s = 1000 kb/s（网络速率的 k 也是十进制 1000）。
          上方输入 8 bit = 1 B 可直接验证这层关系。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">1TB 硬盘为什么显示 931GB？</h3>
            <p class="text-sm text-muted-foreground mt-1">厂商按十进制标 1 TB = 10¹² B，Windows 按二进制（GiB，2³⁰ B）去读：10¹² ÷ 2³⁰ ≈ 931.32，即「931 GB」。差额是进制口径差，不是容量虚标。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">1 GiB 等于多少 GB？</h3>
            <p class="text-sm text-muted-foreground mt-1">1 GiB = 2³⁰ B = 1 073 741 824 B = 1.073741824 GB（约 1.0737 GB）；反过来 1 GB = 0.9313 GiB = 953.6743 MiB。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">8 bit 为什么等于 1 B？bit 和 Byte 有什么区别？</h3>
            <p class="text-sm text-muted-foreground mt-1">bit（位）是二进制最小单位，Byte（字节）= 8 bit，是历史上按 ASCII 字符编码定的标准。网络速率惯用 bit（Mb/s、Gb/s），容量惯用 Byte（KB、GB），小写 b 与大写 B 的区别就在这里。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">换算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有存储单位换算都在你的浏览器本地完成，不发送任何网络请求，输入数值不会被存储或上传。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="TOOL_ID" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  HardDrive, ArrowLeftRight, CheckCircle, TriangleAlert, ChevronUp, ChevronDown,
  Info, RefreshCw, Play, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { trackEvent } from '~/utils/track'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'data-unit-converter'

// ---------- SEO ----------
useSeoMeta({
  title: '数据存储单位换算 - KB/MB/GB/TB 与 KiB/MiB/GiB 双口径在线换算工具',
  description: '免费在线数据存储单位换算：bit、B、KB/MB/GB/TB/PB/EB/ZB/YB（十进制）与 KiB/MiB/GiB/TiB/PiB/EiB/ZiB/YiB（二进制）双体系并列换算，附 1TB=931.3226GiB 明细展开、单位因子明细表、100M 宽带 Mb/s 与 MB/s 科普，纯浏览器本地运行不上传',
  keywords: '数据存储单位换算,gb mb kb换算,gib和gb区别,tb gb转换,bit byte换算,1tb是多少gb,存储单位换算器',
  author: '有条工具',
  ogTitle: '数据存储单位换算 - KB/MB/GB 与 KiB/MiB/GiB 双口径换算 | 有条工具',
  ogDescription: 'bit 到 YB 十进制与二进制双体系换算，1TB=931.3226GiB 明细展开，宽带 Mb/s 科普，纯本地换算。',
  ogUrl: 'https://www.util.cn/tools/data-unit-converter',
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
          name: '数据存储单位换算器',
          url: 'https://www.util.cn/tools/data-unit-converter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['bit/B/KB…YB（SI ×1000）与 KiB…YiB（IEC ×1024）双体系并列换算', '双列结果实时联动，任一单位输入', '当前值与 18 个单位的完整精度换算明细展开', '单位因子明细表（精确定义 × 同级对侧换算）', '硬盘 1TB=931.3226GiB 口径科普', '宽带 Mb/s 与 MB/s 之辨注记', '结果一键复制', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '数据存储单位换算器', item: 'https://www.util.cn/tools/data-unit-converter/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '1TB 硬盘为什么显示 931GB？',
              acceptedAnswer: { '@type': 'Answer', text: '厂商按十进制标 1 TB = 10¹² B，Windows 按二进制 GiB（2³⁰ B）读：10¹² ÷ 2³⁰ ≈ 931.32，即「931 GB」。差额是进制口径差，不是容量虚标。' }
            },
            {
              '@type': 'Question',
              name: '1 GiB 等于多少 GB？',
              acceptedAnswer: { '@type': 'Answer', text: '1 GiB = 2³⁰ B = 1 073 741 824 B = 1.073741824 GB；反过来 1 GB = 0.9313 GiB = 953.6743 MiB。每级差 2.4%，级别越高差距越大。' }
            },
            {
              '@type': 'Question',
              name: '8 bit 为什么等于 1 B？bit 和 Byte 有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: 'bit（位）是二进制最小单位，Byte（字节）= 8 bit。网络速率惯用 bit（100 Mb/s ÷ 8 = 12.5 MB/s），容量惯用 Byte，小写 b 与大写 B 不可混写。' }
            },
            {
              '@type': 'Question',
              name: '换算数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有存储单位换算都在浏览器本地完成，不发送任何网络请求，输入数值不会被存储或上传。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- PURE-FNS-START ----------
// 换算系数以字节（B）为基准：B_PER[unit] = 该单位 1 份对应多少 B
// 十进制体系（SI）：每级 10³；二进制体系（IEC）：每级 2¹⁰。2 的幂在双精度浮点内精确。
const B_PER = {
  bit: 1 / 8,   // 比特（位）
  B: 1,         // 字节（基准）
  KB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12, PB: 1e15, EB: 1e18, ZB: 1e21, YB: 1e24,
  KIB: 2 ** 10, MIB: 2 ** 20, GIB: 2 ** 30, TIB: 2 ** 40,
  PIB: 2 ** 50, EIB: 2 ** 60, ZIB: 2 ** 70, YIB: 2 ** 80
}

// 十进制列（bit 与 B 为两体系公共基准，双列都显示）
const DECIMAL_UNITS = [
  { id: 'bit', symbol: 'bit', name: '比特（位）' },
  { id: 'B', symbol: 'B', name: '字节（byte）' },
  { id: 'KB', symbol: 'KB', name: '千字节（kilobyte）' },
  { id: 'MB', symbol: 'MB', name: '兆字节（megabyte）' },
  { id: 'GB', symbol: 'GB', name: '吉字节（gigabyte）' },
  { id: 'TB', symbol: 'TB', name: '太字节（terabyte）' },
  { id: 'PB', symbol: 'PB', name: '拍字节（petabyte）' },
  { id: 'EB', symbol: 'EB', name: '艾字节（exabyte）' },
  { id: 'ZB', symbol: 'ZB', name: '泽字节（zettabyte）' },
  { id: 'YB', symbol: 'YB', name: '尧字节（yottabyte）' }
]

// 二进制列（KiB 起专属 IEC 记法）
const BINARY_ONLY_UNITS = [
  { id: 'KIB', symbol: 'KiB', name: '二进制千字节（kibibyte）' },
  { id: 'MIB', symbol: 'MiB', name: '二进制兆字节（mebibyte）' },
  { id: 'GIB', symbol: 'GiB', name: '二进制吉字节（gibibyte）' },
  { id: 'TIB', symbol: 'TiB', name: '二进制太字节（tebibyte）' },
  { id: 'PIB', symbol: 'PiB', name: '二进制拍字节（pebibyte）' },
  { id: 'EIB', symbol: 'EiB', name: '二进制艾字节（exbibyte）' },
  { id: 'ZIB', symbol: 'ZiB', name: '二进制泽字节（zebibyte）' },
  { id: 'YIB', symbol: 'YiB', name: '二进制尧字节（yobibyte）' }
]

const BINARY_UNITS = [
  { id: 'bit', symbol: 'bit', name: '比特（位）' },
  { id: 'B', symbol: 'B', name: '字节（byte）' },
  ...BINARY_ONLY_UNITS
]

// 同级对侧配对（bit↔B、KB↔KiB …… YB↔YiB）
const LEVEL_PAIR = {
  bit: 'B', B: 'bit',
  KB: 'KIB', KIB: 'KB', MB: 'MIB', MIB: 'MB', GB: 'GIB', GIB: 'GB',
  TB: 'TIB', TIB: 'TB', PB: 'PIB', PIB: 'PB', EB: 'EIB', EIB: 'EB',
  ZB: 'ZIB', ZIB: 'ZB', YB: 'YIB', YIB: 'YB'
}

// 精确字节因子表达（用于明细表展示）
const FACTOR_TEXT = {
  bit: '1/8 B（0.125 B）',
  B: '1 B（基准）',
  KB: '10³ B = 1000 B',
  MB: '10⁶ B = 1 000 000 B',
  GB: '10⁹ B = 1 000 000 000 B',
  TB: '10¹² B = 1 000 000 000 000 B',
  PB: '10¹⁵ B',
  EB: '10¹⁸ B',
  ZB: '10²¹ B',
  YB: '10²⁴ B',
  KIB: '2¹⁰ B = 1024 B',
  MIB: '2²⁰ B = 1 048 576 B',
  GIB: '2³⁰ B = 1 073 741 824 B',
  TIB: '2⁴⁰ B = 1 099 511 627 776 B',
  PIB: '2⁵⁰ B',
  EIB: '2⁶⁰ B',
  ZIB: '2⁷⁰ B',
  YIB: '2⁸⁰ B'
}

// 浮点尾差清洗：按 12 位有效数字截断；若与更低有效位的舍入值仅差相对 1e-9 以内则吸附，
// 使往返换算（如 GB→GiB→GB）精确回到原值
function cleanFloat(v, sig = 12) {
  if (!Number.isFinite(v)) return NaN
  if (v === 0) return 0
  for (const s of [6, 8, 10]) {
    const cand = Number(v.toPrecision(s))
    if (cand !== 0 && Math.abs(v - cand) / Math.abs(v) < 1e-9) return cand
  }
  return Number(v.toPrecision(sig))
}

// 任意单位 → 字节
function toB(value, unitId) {
  const k = B_PER[unitId]
  if (!Number.isFinite(value) || typeof k !== 'number') return NaN
  return cleanFloat(value * k)
}

// 字节 → 任意单位
function fromB(bytes, unitId) {
  const k = B_PER[unitId]
  if (!Number.isFinite(bytes) || typeof k !== 'number') return NaN
  return cleanFloat(bytes / k)
}

// 通用换算：value 按 fromId 输入，结果按 toId 表达
function convertData(value, fromId, toId) {
  return fromB(toB(value, fromId), toId)
}

// 输入解析：空串/非数字/负数一律视为无效（容量非负）
function parseDataInput(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') return null
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : null
}

// 展示格式化：6 位小数去尾零；极小（< 10⁻⁴）与超大（≥ 10¹⁵）用科学计数
function fmtData(v) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—'
  if (v === 0) return '0'
  const a = Math.abs(v)
  if (a < 1e-4 || a >= 1e15) {
    let s = v.toExponential(6)
    s = s.replace(/(\.\d*?)0+e/, '$1e').replace(/\.e/, 'e')
    return s
  }
  const s = v.toFixed(6)
  return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s
}

// 完整精度字符串（明细展开用，12 位有效数字）
function fmtFull(v) {
  if (!Number.isFinite(v)) return '—'
  return String(cleanFloat(v))
}

// 整数字节总数（千分位展示）：仅当在安全整数范围内
function fmtBytesFull(v) {
  if (!Number.isFinite(v)) return '—'
  if (Number.isInteger(v) && Math.abs(v) < 2 ** 53) return v.toLocaleString('en-US')
  return fmtFull(v)
}

// 互换/预设载入时回填输入框的紧凑字符串（10 位有效数字）
function toInputString(v) {
  if (!Number.isFinite(v)) return ''
  return String(Number(v.toPrecision(10)))
}

// 常见载体容量（unit 为输入单位，十进制标称口径）
const DATA_SCENARIOS = [
  { name: '一张 CD 光盘', v: 700, unit: 'MB', note: '700 MB ≈ 667.57 MiB，盘上标称按十进制' },
  { name: '一张单面 DVD', v: 4.7, unit: 'GB', note: '4.7 GB ≈ 4.377 GiB' },
  { name: '一部蓝光碟（BD25）', v: 25, unit: 'GB', note: '25 GB ≈ 23.28 GiB' },
  { name: '标称 1 TB 硬盘', v: 1, unit: 'TB', note: '系统里显示约 931 GiB——十进制 vs 二进制口径差' },
  { name: '一根 8 GB 内存条', v: 8, unit: 'GIB', note: '内存按二进制标称，8 GB 实为 8 GiB' },
  { name: '100M 宽带满速 1 小时', v: 45, unit: 'GB', note: '100 Mb/s × 3600 s = 45 GB（1 Mb/s = 0.125 MB/s）' }
]
// ---------- PURE-FNS-END ----------

// ---------- 换算状态 ----------
const inputUnit = ref('TB')
const inputValue = ref('1')

function symbolOf(id) {
  return DECIMAL_UNITS.concat(BINARY_ONLY_UNITS).find((u) => u.id === id)?.symbol || id
}

const currentUnit = computed(() => {
  const id = inputUnit.value
  return DECIMAL_UNITS.concat(BINARY_ONLY_UNITS).find((u) => u.id === id) || DECIMAL_UNITS[2]
})
const swapTargetUnit = computed(() => {
  const t = LEVEL_PAIR[inputUnit.value]
  return DECIMAL_UNITS.concat(BINARY_ONLY_UNITS).find((u) => u.id === t) || DECIMAL_UNITS[1]
})

const parsed = computed(() => parseDataInput(inputValue.value))
const bytesValue = computed(() => (parsed.value === null ? NaN : toB(parsed.value, inputUnit.value)))

const decimalRows = computed(() =>
  DECIMAL_UNITS.map((u) => ({ ...u, value: parsed.value === null ? null : fromB(bytesValue.value, u.id) }))
)
const binaryRows = computed(() =>
  BINARY_UNITS.map((u) => ({ ...u, value: parsed.value === null ? null : fromB(bytesValue.value, u.id) }))
)
const canCopy = computed(() => parsed.value !== null)

// 明细：当前值精确字节总数行
const bytesFullLine = computed(() => {
  if (parsed.value === null) return ''
  const b = bytesValue.value
  const v = parsed.value
  return `${fmtFull(v)} ${currentUnit.value.symbol} = ${fmtBytesFull(b)} B = ${fmtBytesFull(cleanFloat(b * 8))} bit`
})

// 明细：与同级对侧单位的关系（含百分比差）
const sameLevelLine = computed(() => {
  if (parsed.value === null) return ''
  const u = inputUnit.value
  if (u === 'bit') return '同级关系：8 bit = 1 B（bit 是二进制位，Byte 是字节，8 倍关系）。'
  if (u === 'B') return '同级关系：1 B = 8 bit（网络速率 Mb/s 按 bit 计：100 Mb/s = 12.5 MB/s）。'
  const pair = LEVEL_PAIR[u]
  const ratioTo = cleanFloat(B_PER[u] / B_PER[pair])    // 1 当前单位 = X 对侧单位
  const ratioFrom = cleanFloat(B_PER[pair] / B_PER[u])  // 1 对侧单位 = X 当前单位
  const pct = cleanFloat((ratioFrom - 1) * 100)
  const pctText = pct >= 0 ? `大 ${pct.toFixed(2)}%` : `小 ${(-pct).toFixed(2)}%`
  return `同级对侧：1 ${symbolOf(u)} = ${fmtData(ratioTo)} ${symbolOf(pair)}（1 ${symbolOf(pair)} 比 1 ${symbolOf(u)} ${pctText}）。`
})

// 明细：全部 18 个单位的完整精度换算关系
const detailLines = computed(() => {
  if (parsed.value === null) return []
  const v = parsed.value
  const from = inputUnit.value
  const all = DECIMAL_UNITS.concat(BINARY_ONLY_UNITS).filter((u) => u.id !== from)
  return all.map((u) => `${fmtFull(v)} ${currentUnit.value.symbol} = ${fmtFull(convertData(v, from, u.id))} ${u.symbol}`)
})

const copyText = computed(() => {
  if (parsed.value === null) return ''
  const unit = currentUnit.value
  const decLines = decimalRows.value.map((r) => `${r.symbol}: ${fmtData(r.value)}`)
  const binLines = binaryRows.value.filter((r) => r.id !== 'bit' && r.id !== 'B').map((r) => `${r.symbol}: ${fmtData(r.value)}`)
  return [`输入: ${fmtData(parsed.value)} ${unit.symbol}（${bytesFullLine.value}）`, '— 十进制（SI ×1000）—', ...decLines, '— 二进制（IEC ×1024）—', ...binLines].join('\n')
})

function applyPreset(value, unitId) {
  inputUnit.value = unitId
  inputValue.value = String(value)
  trackEvent('工具结果', '载入示例', TOOL_ID)
}

function loadScenario(row) {
  applyPreset(row.v, row.unit)
}

function swapUnits() {
  const target = LEVEL_PAIR[inputUnit.value]
  if (!target) return
  if (parsed.value !== null) {
    const converted = convertData(parsed.value, inputUnit.value, target)
    if (Number.isFinite(converted)) inputValue.value = toInputString(converted)
  }
  inputUnit.value = target
  trackEvent('工具使用', '互换单位', TOOL_ID)
}

function resetInput() {
  inputValue.value = ''
  copied.value = false
}

// ---------- 静态表（纯常量派生，无浏览器 API） ----------
const quickRows = [
  { v: 1, unit: 'TB', text: '1 TB = 931.3226 GiB（系统显示 931 GB 的由来）' },
  { v: 1, unit: 'GIB', text: '1 GiB = 1.0737 GB（+7.37%）' },
  { v: 100, unit: 'MB', text: '100 MB ≈ 95.3674 MiB' },
  { v: 8, unit: 'bit', text: '8 bit = 1 B' },
  { v: 700, unit: 'MB', text: '700 MB 一张 CD ≈ 667.57 MiB' }
]

const scenarioRows = DATA_SCENARIOS.map((s) => {
  const pair = LEVEL_PAIR[s.unit]
  return {
    name: s.name,
    v: s.v,
    unit: s.unit,
    note: s.note,
    valueText: `${fmtData(s.v)} ${symbolOf(s.unit)}`,
    oppositeText: `≈ ${fmtData(convertData(s.v, s.unit, pair))} ${symbolOf(pair)}`
  }
})

const FACTOR_NOTES = {
  bit: '二进制最小单位；网络速率按 bit 计（Mb/s）',
  B: '两体系公共基准；容量按 Byte 计',
  KB: '十进制 SI（严格记法 kB）；硬盘/U 盘标称口径',
  MB: 'CD 标称 700 MB、照片 3-8 MB 常用口径',
  GB: '十进制；电影 2-25 GB、流量包口径',
  TB: '十进制；硬盘/SSD 标称口径（1 TB = 931.3226 GiB）',
  PB: '数据中心/大数据集群容量级',
  EB: '全球年数据量级（2020 年代数 ZB 级）',
  ZB: '全球数据总量口径（IDC 预测 2025 约 175 ZB）',
  YB: '目前仅理论计量口径',
  KIB: 'IEC 二进制；比 1 KB 大 2.4%',
  MIB: 'IEC 二进制；1 MiB = 1.048576 MB（+4.86%）',
  GIB: 'IEC 二进制；Windows「GB」实为 GiB；内存标称口径',
  TIB: 'IEC 二进制；1 TiB = 1.0995 TB（+9.95%）',
  PIB: 'IEC 二进制；超大规模存储集群',
  EIB: 'IEC 二进制；1 EiB = 1.1529 EB',
  ZIB: 'IEC 二进制；理论口径',
  YIB: 'IEC 二进制；理论口径'
}

const FACTOR_ORDER = ['bit', 'B', 'KB', 'KIB', 'MB', 'MIB', 'GB', 'GIB', 'TB', 'TIB', 'PB', 'PIB', 'EB', 'EIB', 'ZB', 'ZIB', 'YB', 'YIB']

const factorRows = FACTOR_ORDER.map((id) => {
  const pair = LEVEL_PAIR[id]
  const ratioTo = cleanFloat(B_PER[id] / B_PER[pair])   // 1 该单位 = X 对侧单位
  const ratioFrom = cleanFloat(B_PER[pair] / B_PER[id]) // 1 对侧单位 = X 该单位
  const sym = symbolOf(id)
  const pairSym = symbolOf(pair)
  return {
    id,
    symbol: sym,
    factorText: FACTOR_TEXT[id],
    pairText: `1 ${sym} = ${fmtData(ratioTo)} ${pairSym}（反向 1 ${pairSym} = ${fmtData(ratioFrom)} ${sym}）`,
    note: FACTOR_NOTES[id] || ''
  }
})

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
    trackEvent('工具结果', '复制', TOOL_ID)
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

const ALL_UNIT_IDS = DECIMAL_UNITS.concat(BINARY_ONLY_UNITS).map((u) => u.id)

function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (ALL_UNIT_IDS.includes(s.inputUnit)) inputUnit.value = s.inputUnit
    if (typeof s.inputValue === 'string' && parseDataInput(s.inputValue) !== null) inputValue.value = s.inputValue
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
