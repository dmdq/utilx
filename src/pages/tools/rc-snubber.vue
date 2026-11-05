<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Waves class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">RC吸收电路估算</h1>
          <p class="text-sm text-muted-foreground mt-1">开关回路 RC Snubber 参数估算：振铃频率反推、经验式选值与功率损耗核算</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        针对开关电源 / 电机驱动中开关沿后的高频振铃，提供两种估算路径：示波器实测振铃频率反推吸收电阻 Rs，或按回路寄生 L/C 用经验式 Rs = √(L/C)、Cs = 2~3×C 寄生 选值；并核算吸收电路自身的开关损耗 P = Cs×V²×fs。推荐值自动吸附到 E24 电阻档与常见陶瓷容值档，全部计算在浏览器本地完成，最终以实测波形为准。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算器 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> RC 吸收电路参数估算
        </h2>

        <!-- 模式切换 -->
        <div class="grid grid-cols-2 gap-2">
          <button
            @click="mode = 'ring'"
            :class="mode === 'ring' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2.5 rounded-lg text-sm font-medium transition-all"
          >振铃频率反推 · 示波器实测</button>
          <button
            @click="mode = 'empirical'"
            :class="mode === 'empirical' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2.5 rounded-lg text-sm font-medium transition-all"
          >经验式 · 按寄生 L/C 估算</button>
        </div>

        <!-- 共享输入：寄生电容 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">寄生电容 Cstray（pF）</label>
          <input
            v-model.number="cstray"
            type="number"
            min="0"
            step="10"
            class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">开关节点的等效杂散电容（MOSFET 输出电容 + 变压器/走线杂散），默认 100pF 为无实测资料时的常用估算起点，条件允许时用电桥或器件手册求和确认</p>
        </div>

        <!-- 模式一：振铃反推 -->
        <div v-if="mode === 'ring'" class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">振铃频率 fring（MHz）</label>
            <input
              v-model.number="fring"
              type="number"
              min="0"
              step="1"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">示波器测振铃周期取倒数；开关沿后 5~50MHz 振铃常见</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">振铃幅度 Vring（V，峰值）</label>
            <input
              v-model.number="vring"
              type="number"
              min="0"
              step="5"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">用于估算流过 Rs 的尖峰电流与电阻选型，可留空</p>
          </div>
        </div>

        <!-- 模式二：经验式 -->
        <div v-else class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">回路寄生电感 Lstray（nH）</label>
            <input
              v-model.number="lstray"
              type="number"
              min="0"
              step="10"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">功率回路走线约 10nH/cm 量级；变压器漏感可实测或按 1~5% 匝比估算</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">经验关系</label>
            <div class="px-3 py-2.5 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              Rs = √(Lstray/Cstray)，Cs = 2~3×Cstray
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">按临界阻尼设计，R 匹配振铃源的特征阻抗</p>
          </div>
        </div>

        <!-- 推荐结果 -->
        <div v-if="rec" class="space-y-3">
          <div class="bg-primary/10 rounded-lg p-5 text-center">
            <p class="text-xs text-muted-foreground mb-1">
              {{ rec.kind === 'ring' ? 'Rs ≈ 1 / (2π × fring × Cstray)' : 'Rs = √(Lstray / Cstray)' }}
            </p>
            <p class="text-4xl font-bold text-primary">{{ fmt(rec.rsSnap, 2) }} <span class="text-lg">Ω</span></p>
            <p class="text-sm text-foreground mt-2 font-medium">推荐吸收电阻 Rs（E24 标准档）</p>
            <p class="text-xs text-muted-foreground mt-1">计算值 {{ fmt(rec.rsRaw, 2) }}Ω → 就近吸附 E24 档 {{ fmt(rec.rsSnap, 2) }}Ω，建议用 1W 以上薄膜/绕线电阻</p>
            <div class="mt-2 flex items-center justify-center gap-2 text-sm">
              <span :class="['px-2.5 py-0.5 rounded-full font-medium', rec.tier.cls, rec.tier.bg]">{{ rec.tier.label }}</span>
            </div>
            <p class="text-xs text-muted-foreground mt-2">{{ rec.tier.note }}</p>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">吸收电容 Cs（2~3×Cstray 吸附容值档）</p>
              <p class="text-sm font-bold text-foreground">{{ fmt(rec.csLow, 0) }} ~ {{ fmt(rec.csHigh, 0) }} pF</p>
              <p class="text-[10px] text-muted-foreground mt-0.5">从低档起试，损耗小、阻尼不够再加大</p>
            </div>
            <div v-if="rec.kind === 'ring' && rec.ipk !== null" class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">流过 Rs 的尖峰电流 Vring/Rs</p>
              <p class="text-sm font-bold text-foreground">{{ fmt(rec.ipk, 2) }} A</p>
              <p class="text-[10px] text-muted-foreground mt-0.5">峰值电流，注意电阻的脉冲功率能力</p>
            </div>
            <div v-if="rec.kind === 'empirical'" class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">对应振铃频率 1/(2π√(LC))</p>
              <p class="text-sm font-bold text-foreground">{{ fmt(rec.fringEst, 2) }} MHz</p>
              <p class="text-[10px] text-muted-foreground mt-0.5">可与此后实测振铃频率互相印证</p>
            </div>
          </div>

          <button
            @click="copyResult"
            class="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            <Clipboard class="w-3.5 h-3.5" /> 复制计算结果
          </button>
        </div>
        <div v-else class="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          请输入大于 0 的寄生电容，以及{{ mode === 'ring' ? '振铃频率' : '寄生电感' }}。
        </div>

        <!-- 损耗核算 -->
        <div class="border-t border-border/50 pt-4 space-y-3">
          <h3 class="text-sm font-medium text-foreground flex items-center">
            <Zap class="w-4 h-4 mr-1.5 text-primary" /> 吸收电路损耗核算（填入开关频率 fs）
          </h3>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-medium text-foreground mb-1.5">吸收电容 Cs（pF）</label>
              <input
                v-model.number="lossCs"
                type="number"
                min="0"
                step="10"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-foreground mb-1.5">充放电幅度 V（V）</label>
              <input
                v-model.number="lossV"
                type="number"
                min="0"
                step="10"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-foreground mb-1.5">开关频率 fs（kHz）</label>
              <input
                v-model.number="lossFs"
                type="number"
                min="0"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div v-if="loss" class="space-y-2">
            <div :class="['rounded-lg p-4', loss.tier.bg]">
              <div class="flex items-baseline justify-between">
                <p class="text-xs text-muted-foreground">P = Cs × V² × fs（每周期完整充放电的保守上界）</p>
                <p :class="['text-2xl font-bold', loss.tier.cls]">{{ fmt(loss.p, 2) }} W</p>
              </div>
              <p class="text-xs text-muted-foreground mt-1.5">{{ loss.tier.note }}</p>
            </div>
            <div class="flex justify-between items-center py-1.5 px-3 bg-muted/50 rounded-lg text-sm">
              <span class="text-muted-foreground">电阻功率建议（≥2×P，吸附标准功率档）</span>
              <span class="text-foreground font-medium">{{ loss.recW !== null ? '≥ ' + fmt(loss.recW, 2) + ' W' : '需并联多个电阻或定制大功率电阻' }}</span>
            </div>
          </div>
          <div v-else class="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            填入 Cs、幅度与开关频率后显示损耗。
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 判定说明 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-base font-semibold text-foreground mb-3 flex items-center">
            <Gauge class="w-4 h-4 mr-2 text-primary" /> Rs 取值合理性判定
          </h2>
          <div class="space-y-2.5 text-sm">
            <div class="flex gap-2.5 items-start">
              <span class="mt-1 w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0"></span>
              <div>
                <p class="text-green-600 dark:text-green-400 font-medium">4.7 ~ 100Ω · 常见区间</p>
                <p class="text-xs text-muted-foreground">多数开关电源功率回路的吸收电阻落在此范围，可按推荐档直装验证。</p>
              </div>
            </div>
            <div class="flex gap-2.5 items-start">
              <span class="mt-1 w-2.5 h-2.5 rounded-full bg-yellow-500 flex-shrink-0"></span>
              <div>
                <p class="text-yellow-600 dark:text-yellow-400 font-medium">偏小 / 偏大 · 先核对输入</p>
                <p class="text-xs text-muted-foreground">优先检查单位：频率填 MHz、电容填 pF；R 过小损耗剧增，过大阻尼不足。</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 标准档说明 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-base font-semibold text-foreground mb-3 flex items-center">
            <Layers class="w-4 h-4 mr-2 text-primary" /> 标准档吸附说明
          </h2>
          <div class="text-sm space-y-2 text-muted-foreground">
            <p><span class="text-foreground font-medium">电阻：</span>吸附 E24 系列（10/11/12/13/15/16/18/20/22/24/27/30/33/36/39/43/47/51/56/62/68/75/82/91 × 10ⁿ），贴片与直插均易购。</p>
            <p><span class="text-foreground font-medium">电容：</span>吸附常见陶瓷容值档（1.0/1.5/2.2/3.3/4.7/6.8 × 10ⁿ pF，即 CB 档），优先选 C0G/NP0 小容量高压瓷介。</p>
            <p><span class="text-foreground font-medium">耐压：</span>Cs 与 Rs 的耐压/功率按尖峰电压留 50% 以上裕量；Rs 优先 1206 及以上封装或绕线电阻。</p>
          </div>
        </div>

        <!-- 快速自核示例 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-base font-semibold text-foreground mb-3 flex items-center">
            <FlaskConical class="w-4 h-4 mr-2 text-primary" /> 快速自核示例
          </h2>
          <div class="space-y-2">
            <button
              @click="loadExample('ring')"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              振铃反推：fring=20MHz、Cstray=100pF → Rs = 1/(2π×20M×100p) ≈ <span class="text-foreground font-medium">79.6Ω → 吸附 82Ω（E24）</span>
            </button>
            <button
              @click="loadExample('loss')"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              损耗核算：Cs=220pF、V=325V、fs=100kHz → P = 220p×325²×100k ≈ <span class="text-foreground font-medium">2.32W → 电阻 ≥5W</span>
            </button>
          </div>
        </div>

        <!-- 免责声明 -->
        <div class="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p class="text-xs text-muted-foreground leading-relaxed">
            本工具按一阶阻尼模型与工程经验式快速估算，未计入开关波形细节、布线分布与器件非线性。吸收参数最终以实测振铃波形与温升为准：装上后观察振铃幅度衰减与电阻温度，微调至阻尼适中。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>RC吸收电路估算原理与用法</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <h3 class="text-lg font-semibold text-foreground">振铃从哪来：寄生 L-C 的自由振荡</h3>
          <p>
            开关管关断瞬间，功率回路里的寄生电感（走线、变压器漏感）与节点寄生电容（MOSFET 输出电容、结电容）构成一个高 Q 值的 L-C 谐振回路，被开关沿激励后自由振荡，这就是示波器上看到的振铃。振铃频率 f = 1/(2π√(LC))，特征阻抗为 √(L/C)。RC 吸收电路的作用是用 Rs 消耗振荡能量、把 Q 值压下来：R 与特征阻抗匹配时阻尼最经济，这也是 Rs = √(Lstray/Cstray) 的由来。功率回路选型可配合 <NuxtLink to="/tools/buck-inductor-calculator" class="text-primary hover:underline">BUCK电感选型计算器</NuxtLink> 一并核对电感参数。
          </p>
          <h3 class="text-lg font-semibold text-foreground">为什么吸收电阻不能太小</h3>
          <p>
            Rs 越小，充电电流尖峰越大（I ≈ V/R），电阻与开关管的电流应力剧增，损耗按 Cs×V²×fs 直接由 R 承担且 R 上压降能量随 R 减小并不减少——电容储能只与 C 和 V 有关，R 只决定放多快。R 太小时接近把电容直接短路到地，振铃确实没了，但代价是发热、EMI 电流尖峰甚至损坏电阻；太小还会把开关沿拖缓，增加开关损耗。工程上从 Rs = √(L/C) 起步，阻尼不够再逐步减小。
          </p>
          <h3 class="text-lg font-semibold text-foreground">损耗与保护的权衡</h3>
          <p>
            吸收电路的损耗 P = Cs×V²×fs 与 Cs、幅度平方、频率成正比：325V 母线上 220pF 每 100kHz 就要耗散约 2.3W，这是"用效率换保护"的直接代价。权衡方法是：只保护需要保护的东西——振铃幅度已不危及器件耐压时不必加吸收；先取 Cs 下限（2×Cstray）验证效果；大功率场合考虑无损吸收或 RCD 钳位把能量回馈。本工具的损耗核算卡就是给这个权衡定量的。
          </p>
          <h3 class="text-lg font-semibold text-foreground">测振铃要带宽足够</h3>
          <p>
            开关振铃普遍在 20~100MHz，示波器与探头系统带宽建议 ≥ 100MHz（至少 5 倍于被测频率），否则振铃被滤成"毛刺"读不出频率与幅度。探头务必用接地弹簧替代长地线夹——几十厘米的地线环路本身就是一个谐振回路，会凭空造出假振铃或把真振铃放大。读频率取振铃稳定段的多周期平均，读幅度取第一个峰的峰值。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">Cstray 不知道确切值怎么办？</span>先用默认 100pF 估算装上 82Ω + 220pF 试凑，再按"振铃频率减半需要 Cs 加倍到 3 倍"的方向微调；有条件用 LCR 表在开关管漏-源极间实测更准。</li>
            <li><span class="text-foreground font-medium">Cs 用什么材质？</span>首选 C0G/NP0 瓷介（损耗低、无压电啸叫），耐压按尖峰电压的 1.5~2 倍选；X7R 容量随直流偏压下降明显，吸收场合要预留。</li>
            <li><span class="text-foreground font-medium">装了吸收后电阻很烫正常吗？</span>按 P = Cs×V²×fs 核算：若实测温升对应功耗超过电阻额定一半以上，加大封装/功率档，或减小 Cs，或改 RCD 钳位。</li>
            <li><span class="text-foreground font-medium">RC 吸收和 TVS/钳位二极管怎么选？</span>RC 吸收"软"处理每次开关的振铃；TVS/钳位只在电压超出阈值时动作，适合偶发尖峰。两者常配合使用，先用 RC 压振铃，再用钳位兜底。</li>
          </ul>
          <p class="text-xs pt-2 border-t border-border/50">本工具为快速估算，吸收参数以实测波形与温升为准。</p>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'rc-snubber'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Waves, Calculator, Gauge, Layers, Zap, FlaskConical, AlertTriangle, Clipboard, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'RC吸收电路估算 - Snubber振铃抑制参数计算 | Util工具箱',
  description: '在线 RC 吸收电路估算工具：示波器实测振铃频率反推吸收电阻 Rs，经验式 Rs=√(L/C)、Cs=2~3×Cstray 选值，损耗 P=Cs×V²×fs 核算，推荐值吸附 E24 电阻档与陶瓷容值档，纯本地计算',
  keywords: 'RC吸收电路, snubber计算, 振铃抑制, 吸收电阻, 尖峰吸收, 缓冲电路计算, 振铃频率, 开关电源吸收, mosfet振铃, rc snubber',
  author: 'Util工具箱',
  ogTitle: 'RC吸收电路估算 - Snubber振铃抑制参数计算',
  ogDescription: '振铃频率反推吸收电阻、经验式选值与损耗核算，吸附 E24/容值标准档',
  ogUrl: 'https://www.util.cn/tools/rc-snubber',
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
          name: 'RC吸收电路估算',
          url: 'https://www.util.cn/tools/rc-snubber',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['振铃频率反推 Rs', '经验式 Rs=√(L/C) 估算', 'Cs=2~3×Cstray 吸附容值档', '损耗 P=Cs×V²×fs 核算', 'E24 电阻档吸附', '尖峰电流估算']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: 'RC吸收电路估算', item: 'https://www.util.cn/tools/rc-snubber' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '开关电源的振铃是从哪里来的？',
              acceptedAnswer: { '@type': 'Answer', text: '寄生电感与寄生电容构成的高 Q 值 L-C 回路被开关沿激励后自由振荡，振铃频率为 1/(2π√(LC))，特征阻抗 √(L/C)。' }
            },
            {
              '@type': 'Question',
              name: '为什么吸收电阻 Rs 不能太小？',
              acceptedAnswer: { '@type': 'Answer', text: '电容储能只与 C、V 有关，R 太小不会减少损耗，反而增大电流尖峰与 EMI，拖缓开关沿并加剧发热；应从 Rs=√(L/C) 起步逐步微调。' }
            },
            {
              '@type': 'Question',
              name: '吸收电路损耗怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: '按每周期完整充放电的保守上界 P = Cs×V²×fs 估算，例如 220pF、325V、100kHz 约 2.3W，电阻功率按 2 倍以上裕量选取。' }
            },
            {
              '@type': 'Question',
              name: '测振铃对示波器有什么要求？',
              acceptedAnswer: { '@type': 'Answer', text: '振铃多在 20~100MHz，系统带宽建议 ≥100MHz，并用接地弹簧替代长地线夹，避免探头地线环路引入假振铃。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'rc-snubber'
const STORE_KEY = TOOL_ID + ':inputs'
const tool = tools.find(t => t.id === TOOL_ID)

// ===== PURE-FNS-START（节点单测按标记抽取本段执行；保持自包含，勿引用外部变量）=====
const E24 = [10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91]
const CAP_LADDER = [1, 1.5, 2.2, 3.3, 4.7, 6.8]
const POWER_RATINGS = [0.125, 0.25, 0.5, 1, 2, 3, 5, 10]

// 吸附到 E24 电阻档（0.01Ω ~ 100kΩ，按对数距离就近）；toPrecision(12) 消除 82×10⁻¹=8.20000…001 类浮点尾差
const snapE24 = (v) => {
  if (!(v > 0) || !isFinite(v)) return NaN
  let best = NaN, bestDiff = Infinity
  for (let d = -2; d <= 5; d++) {
    for (const base of E24) {
      const cand = Number((base * Math.pow(10, d)).toPrecision(12))
      const diff = Math.abs(Math.log(v / cand))
      if (diff < bestDiff - 1e-12) { bestDiff = diff; best = cand }
    }
  }
  return best
}

// 吸附到常见陶瓷容值档（1pF ~ 680µF，CB 档：1.0/1.5/2.2/3.3/4.7/6.8 ×10ⁿ pF）
const snapCapPF = (pF) => {
  if (!(pF > 0) || !isFinite(pF)) return NaN
  let best = NaN, bestDiff = Infinity
  for (let d = 0; d <= 9; d++) {
    for (const base of CAP_LADDER) {
      const cand = Number((base * Math.pow(10, d)).toPrecision(12))
      const diff = Math.abs(Math.log(pF / cand))
      if (diff < bestDiff - 1e-12) { bestDiff = diff; best = cand }
    }
  }
  return best
}

// 模式一：振铃频率反推 Rs ≈ 1/(2π·fring·Cstray)，fring 单位 MHz、Cstray 单位 pF，返回 Ω
const rsFromRing = (fringMHz, cstrayPF) => {
  const f = fringMHz * 1e6
  const c = cstrayPF * 1e-12
  return 1 / (2 * Math.PI * f * c)
}

// 尖峰电流 Vring/Rs
const peakCurrent = (vRingV, rsOhm) => {
  if (!(rsOhm > 0) || !isFinite(vRingV)) return NaN
  return vRingV / rsOhm
}

// 模式二：特征阻抗 Rs = √(Lstray/Cstray)，lstray 单位 nH、cstray 单位 pF，返回 Ω
const zoFromLC = (lstrayNH, cstrayPF) => {
  const l = lstrayNH * 1e-9
  const c = cstrayPF * 1e-12
  return Math.sqrt(l / c)
}

// 模式二：对应振铃频率 1/(2π√(LC))，返回 MHz
const ringFreqFromLC = (lstrayNH, cstrayPF) => {
  const l = lstrayNH * 1e-9
  const c = cstrayPF * 1e-12
  return 1 / (2 * Math.PI * Math.sqrt(l * c)) / 1e6
}

// 损耗核算 P = Cs×V²×fs，cs 单位 pF、fs 单位 kHz，返回 W
const snubberLoss = (csPF, vV, fsKHz) => {
  return csPF * 1e-12 * vV * vV * fsKHz * 1e3
}

// 电阻功率档建议：≥2×P 吸附标准功率档，超出档位返回 null
const recPower = (pW) => {
  if (!(pW > 0) || !isFinite(pW)) return NaN
  const target = 2 * pW
  for (const r of POWER_RATINGS) {
    if (r >= target) return r
  }
  return null
}

// Rs 取值合理性判定（多数开关功率回路吸收电阻在 4.7~100Ω）
const rsTier = (rs) => {
  if (!(rs > 0) || !isFinite(rs)) {
    return { label: '输入无效', cls: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10', note: '请检查输入是否为正数。' }
  }
  if (rs < 4.7) {
    return { label: '偏小 · 先核对输入', cls: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10', note: '确认电容单位是 pF、频率单位是 MHz；R 过小时电流尖峰与损耗剧增，不建议直接采用。' }
  }
  if (rs <= 100) {
    return { label: '常见区间', cls: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10', note: '多数开关功率回路的吸收电阻落在 4.7~100Ω，可按推荐档装机实测验证。' }
  }
  return { label: '偏大 · 先核对输入', cls: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10', note: '确认振铃频率单位（MHz）与 Cstray 是否漏填；R 过大阻尼不足，振铃抑制效果有限。' }
}

// 损耗判定
const lossTier = (p) => {
  if (!(p > 0) || !isFinite(p)) {
    return { label: '输入无效', cls: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10', note: '请检查 Cs、V、fs 是否为正数。' }
  }
  if (p < 0.1) {
    return { label: '损耗可忽略', cls: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10', note: '对效率影响很小，可放心加吸收。' }
  }
  if (p < 0.5) {
    return { label: '损耗可控', cls: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10', note: '正常效率代价范围，注意电阻封装散热。' }
  }
  if (p < 2) {
    return { label: '损耗偏大', cls: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10', note: '评估效率损失是否可接受：优先减小 Cs，或改用 RCD 钳位回收部分能量。' }
  }
  return { label: '损耗大 · 重新权衡', cls: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10', note: '每周期完整充放电的代价已很可观：确认是否必须吸收、减小 Cs，或改无损吸收 / RCD 钳位方案。' }
}
// ===== PURE-FNS-END =====

// ---------- 状态 ----------
const mode = ref('ring') // ring 振铃反推 / empirical 经验式
const cstray = ref(100)
const fring = ref(20)
const vring = ref(50)
const lstray = ref(100)
const lossCs = ref(220)
const lossV = ref(100)
const lossFs = ref(100)

// 交互记录与输入持久化（SSR 安全：localStorage 仅在客户端执行）
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORE_KEY) : null
    if (raw) {
      const s = JSON.parse(raw)
      if (typeof s.mode === 'string') mode.value = s.mode
      if (typeof s.cstray === 'number') cstray.value = s.cstray
      if (typeof s.fring === 'number') fring.value = s.fring
      if (typeof s.vring === 'number') vring.value = s.vring
      if (typeof s.lstray === 'number') lstray.value = s.lstray
      if (typeof s.lossCs === 'number') lossCs.value = s.lossCs
      if (typeof s.lossV === 'number') lossV.value = s.lossV
      if (typeof s.lossFs === 'number') lossFs.value = s.lossFs
    }
  } catch (e) { /* 忽略恢复失败 */ }
})

const persist = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      mode: mode.value, cstray: cstray.value, fring: fring.value, vring: vring.value,
      lstray: lstray.value, lossCs: lossCs.value, lossV: lossV.value, lossFs: lossFs.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
}
watch([mode, cstray, fring, vring, lstray, lossCs, lossV, lossFs], persist)

const num = (v) => (typeof v === 'number' && isFinite(v) ? v : NaN)

// ---------- 数字格式化（避免浮点尾差，如 79.57747154594767 → 79.58） ----------
const fmt = (v, digits = 2) => {
  if (typeof v !== 'number' || !isFinite(v)) return '—'
  return Number(v.toFixed(digits)).toLocaleString('zh-CN', { maximumFractionDigits: digits })
}

// ---------- 推荐结果 ----------
const rec = computed(() => {
  const c = num(cstray.value)
  if (!(c > 0)) return null
  if (mode.value === 'ring') {
    const f = num(fring.value)
    if (!(f > 0)) return null
    const rsRaw = rsFromRing(f, c)
    const vr = num(vring.value)
    return {
      kind: 'ring',
      rsRaw,
      rsSnap: snapE24(rsRaw),
      csLow: snapCapPF(2 * c),
      csHigh: snapCapPF(3 * c),
      ipk: isFinite(vr) && vr > 0 ? peakCurrent(vr, rsRaw) : null,
      tier: rsTier(rsRaw)
    }
  }
  const l = num(lstray.value)
  if (!(l > 0)) return null
  const zo = zoFromLC(l, c)
  return {
    kind: 'empirical',
    rsRaw: zo,
    rsSnap: snapE24(zo),
    csLow: snapCapPF(2 * c),
    csHigh: snapCapPF(3 * c),
    ipk: null,
    fringEst: ringFreqFromLC(l, c),
    tier: rsTier(zo)
  }
})

// ---------- 损耗核算 ----------
const loss = computed(() => {
  const cs = num(lossCs.value), v = num(lossV.value), f = num(lossFs.value)
  if (!(cs > 0) || !(v > 0) || !(f > 0)) return null
  const p = snubberLoss(cs, v, f)
  return { p, recW: recPower(p), tier: lossTier(p) }
})

// ---------- 交互 ----------
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const loadExample = (kind) => {
  if (kind === 'ring') {
    mode.value = 'ring'
    fring.value = 20
    cstray.value = 100
    vring.value = 50
  } else {
    lossCs.value = 220
    lossV.value = 325
    lossFs.value = 100
  }
}

const copyResult = async () => {
  const lines = []
  lines.push('【RC吸收电路估算】')
  lines.push('Cstray=' + fmt(cstray.value, 1) + 'pF，模式：' + (mode.value === 'ring' ? '振铃频率反推' : '经验式 L/C'))
  if (!rec.value) { alert('当前输入不完整，无法复制'); return }
  if (mode.value === 'ring') {
    lines.push('fring=' + fmt(fring.value, 2) + 'MHz → Rs 计算值 ' + fmt(rec.value.rsRaw, 2) + 'Ω，推荐 E24 档 ' + fmt(rec.value.rsSnap, 2) + 'Ω')
    if (rec.value.ipk !== null) lines.push('Vring=' + fmt(vring.value, 1) + 'V → 尖峰电流 ' + fmt(rec.value.ipk, 2) + 'A')
  } else {
    lines.push('Lstray=' + fmt(lstray.value, 1) + 'nH → Rs=√(L/C)=' + fmt(rec.value.rsRaw, 2) + 'Ω，推荐 E24 档 ' + fmt(rec.value.rsSnap, 2) + 'Ω')
    lines.push('对应振铃频率 ' + fmt(rec.value.fringEst, 2) + 'MHz')
  }
  lines.push('推荐 Cs：' + fmt(rec.value.csLow, 0) + '~' + fmt(rec.value.csHigh, 0) + 'pF（2~3×Cstray 吸附容值档）')
  if (loss.value) {
    lines.push('损耗：Cs=' + fmt(lossCs.value, 0) + 'pF、V=' + fmt(lossV.value, 1) + 'V、fs=' + fmt(lossFs.value, 1) + 'kHz → P=' + fmt(loss.value.p, 2) + 'W，电阻建议 ≥' + (loss.value.recW !== null ? fmt(loss.value.recW, 2) + 'W' : '并联/定制'))
  }
  lines.push('—— 来自 Util工具箱·RC吸收电路估算')
  try {
    await navigator.clipboard.writeText(lines.join('\n'))
    alert('已复制到剪贴板')
  } catch (e) {
    alert('复制失败，请手动选择文本复制')
  }
}
</script>
