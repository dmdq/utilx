<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Bike class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">骑行传动比计算 - 速比 / 发展米数 / 踏频车速换算</h1>
          <p class="text-sm text-muted-foreground mt-1">牙盘 × 飞轮 → 速比与发展米数，联动踏频换算车速，附常见套件最大/最小比范围与全齿比速查表</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线骑行传动比计算器：选择牙盘齿数（34/39/46/50/52/53 预设）与飞轮齿数（11-42 预设），
        按轮径展开周长（700c≈2.10m / 26 寸≈2.05m / 27.5≈2.20m / 29 寸≈2.28m，支持自定义）计算：
        <span class="font-medium text-foreground">速比 = 牙盘 ÷ 飞轮</span>、
        <span class="font-medium text-foreground">发展米数 = 速比 × 轮周长</span>（踏一圈前进距离）、
        <span class="font-medium text-foreground">速度 = 发展 × 踏频 × 0.06</span>（km/h），并换算英制 gear inches。
        附常见牙盘飞轮组合的最大比 / 最小比 / 范围倍数（跳档感参考）对照卡与全齿比矩阵速查表。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 页面说明条 -->
    <p class="flex items-start gap-2 text-xs leading-relaxed bg-primary/10 border border-primary/20 text-foreground rounded-lg p-3 mb-6">
      <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
      <span>轮径按"展开周长"（rollout，轮子滚一圈的地面距离）预设，受胎宽与气压影响，精确测速可用标记法实测一圈长度填入自定义。</span>
    </p>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左栏：输入 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Cog class="w-5 h-5 mr-2 text-primary" /> 传动参数
          </h2>

          <!-- 牙盘 -->
          <div>
            <label class="block text-xs font-medium text-foreground mb-1">牙盘齿数 Z1 (T)</label>
            <input
              v-model.number="z1"
              type="number"
              min="26"
              max="60"
              step="1"
              class="w-full px-3 py-2 border border-border rounded-lg bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="如 50"
            />
            <div class="flex flex-wrap gap-2 mt-2">
              <button
                v-for="ring in CHAINRING_PRESETS"
                :key="ring"
                @click="z1 = ring"
                :class="[
                  'px-3 py-1.5 rounded-lg transition text-xs',
                  z1 === ring
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                ]"
              >{{ ring }}T</button>
            </div>
          </div>

          <!-- 飞轮 -->
          <div>
            <label class="block text-xs font-medium text-foreground mb-1">飞轮齿数 Z2 (T)</label>
            <input
              v-model.number="z2"
              type="number"
              min="9"
              max="52"
              step="1"
              class="w-full px-3 py-2 border border-border rounded-lg bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="如 11"
            />
            <div class="flex flex-wrap gap-2 mt-2">
              <button
                v-for="cog in COG_PRESETS"
                :key="cog"
                @click="z2 = cog"
                :class="[
                  'px-3 py-1.5 rounded-lg transition text-xs',
                  z2 === cog
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                ]"
              >{{ cog }}T</button>
            </div>
          </div>

          <!-- 轮径 -->
          <div>
            <label class="block text-xs font-medium text-foreground mb-1">轮径展开周长 (m)</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="w in WHEEL_PRESETS"
                :key="w.id"
                @click="wheelId = w.id"
                :class="[
                  'px-3 py-1.5 rounded-lg transition text-xs',
                  wheelId === w.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                ]"
              >{{ w.label }}</button>
              <button
                @click="wheelId = 'custom'"
                :class="[
                  'px-3 py-1.5 rounded-lg transition text-xs',
                  wheelId === 'custom'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                ]"
              >自定义</button>
            </div>
            <div v-if="wheelId === 'custom'" class="mt-2">
              <input
                v-model.number="customCirc"
                type="number"
                min="0.5"
                max="3"
                step="0.005"
                class="w-full px-3 py-2 border border-border rounded-lg bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder="如 2.105（700×25c 实测）"
              />
              <p class="text-[11px] text-muted-foreground mt-1">实测方法：气门芯对地做标记，直线推行一圈量地面距离。</p>
            </div>
            <p class="text-[11px] text-muted-foreground mt-1">当前周长：{{ circM }} m</p>
          </div>

          <!-- 踏频 -->
          <div>
            <label class="block text-xs font-medium text-foreground mb-1">踏频 (rpm，每分钟踏圈数)</label>
            <input
              v-model.number="rpm"
              type="number"
              min="20"
              max="180"
              step="1"
              class="w-full px-3 py-2 border border-border rounded-lg bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="如 90"
            />
            <div class="flex flex-wrap gap-2 mt-2">
              <button
                v-for="r in RPM_PRESETS"
                :key="r"
                @click="rpm = r"
                :class="[
                  'px-3 py-1.5 rounded-lg transition text-xs',
                  rpm === r
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                ]"
              >{{ r }} rpm</button>
            </div>
          </div>

          <button
            @click="resetInputs"
            class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 恢复默认输入
          </button>
        </div>

        <!-- 公式卡 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-2">
          <h3 class="text-sm font-semibold flex items-center">
            <Info class="w-4 h-4 mr-1.5 text-primary" /> 计算公式
          </h3>
          <ul class="text-xs leading-relaxed text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>速比 = 牙盘齿数 Z1 ÷ 飞轮齿数 Z2</li>
            <li>发展米数 = 速比 × 轮径展开周长（踏一圈前进的米数）</li>
            <li>速度 = 发展米数 × 踏频 × 0.06（m/圈 × 圈/分 × 60分/h ÷ 1000m/km）</li>
            <li>gear inches = 速比 × 轮径（英寸）≈ 发展米数 × 12.53</li>
          </ul>
        </div>
      </div>

      <!-- 右栏：结果（占两列） -->
      <div class="lg:col-span-2 space-y-4">
        <template v-if="gearResult">
          <!-- 核心三值 -->
          <div class="bg-card border border-border rounded-lg p-6">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 class="text-lg font-semibold flex items-center">
                <Gauge class="w-5 h-5 mr-2 text-primary" /> 当前档位
              </h2>
              <span class="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {{ z1 }}T × {{ z2 }}T · {{ wheelLabel }} · {{ rpm }} rpm
              </span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">速比 (Z1/Z2)</p>
                <p class="text-3xl font-bold text-foreground">{{ gearResult.ratio }}</p>
                <p class="text-[11px] text-muted-foreground mt-1">gear inches ≈ {{ gearResult.inches }}"</p>
              </div>
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">发展米数</p>
                <p class="text-3xl font-bold text-primary">{{ gearResult.dev }} <span class="text-sm font-medium">m</span></p>
                <p class="text-[11px] text-muted-foreground mt-1">踏一圈前进距离</p>
              </div>
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">速度 @ {{ rpm }} rpm</p>
                <p class="text-3xl font-bold text-primary">{{ gearResult.speed }} <span class="text-sm font-medium">km/h</span></p>
                <p class="text-[11px] text-muted-foreground mt-1">发展 × 踏频 × 0.06</p>
              </div>
            </div>
            <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
              参考：80-90rpm 是公路骑行的高效踏频区间。当前档 60rpm 约 {{ gearResult.speed60 }} km/h、100rpm 约 {{ gearResult.speed100 }} km/h，可据此预估掉踏频后的掉速幅度。
            </p>
          </div>

          <!-- 常见套件范围卡 -->
          <div class="bg-card border border-border rounded-lg p-6">
            <h3 class="text-sm font-semibold text-foreground mb-1">常见牙盘飞轮组合范围（按当前轮径 {{ circM }}m / {{ rpm }} rpm）</h3>
            <p class="text-[11px] text-muted-foreground mb-3">最大比 = 大盘 ÷ 最小飞，决定极速上限；最小比 = 小盘 ÷ 最大飞，决定爬坡下限；范围倍数越大覆盖越广，但每档齿差的速度跳变（跳档感）也越明显。</p>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-border text-muted-foreground">
                    <th class="py-2 px-3 text-left whitespace-nowrap">套件组合</th>
                    <th class="py-2 px-3 text-left">最大比</th>
                    <th class="py-2 px-3 text-left">最小比</th>
                    <th class="py-2 px-3 text-left">范围倍数（跳档感参考）</th>
                    <th class="py-2 px-3 text-left">最高速 @{{ rpm }}rpm</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in rangeTable"
                    :key="row.label"
                    class="border-b border-border/60 hover:bg-muted/50"
                  >
                    <td class="py-2 px-3 text-foreground whitespace-nowrap">{{ row.label }}</td>
                    <td class="py-2 px-3 text-foreground">{{ row.max }}</td>
                    <td class="py-2 px-3 text-foreground">{{ row.min }}</td>
                    <td class="py-2 px-3 text-muted-foreground">×{{ row.span }}</td>
                    <td class="py-2 px-3 text-muted-foreground">{{ row.topSpeed }} km/h</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
              选型经验：城市通勤最小比 ≥1.5 即可；有长陡坡的山区路线希望最小比 ≤1.2（50/34 × 11-28 的 1.21 略紧，可上 11-32/11-34）；
              竞速取向优先提高最大比与更密的中间档。范围倍数 ×3.5 以上的宽范围飞轮，相邻档齿差大、跳档感明显。
            </p>
          </div>

          <!-- 全齿比速查表 -->
          <div class="bg-card border border-border rounded-lg p-6">
            <h3 class="text-sm font-semibold text-foreground mb-3">全齿比速查表（速比 = 行 ÷ 列）</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-xs">
                <thead>
                  <tr class="border-b border-border text-muted-foreground">
                    <th class="py-2 px-2 text-left">牙盘 \ 飞轮</th>
                    <th
                      v-for="cog in COG_PRESETS"
                      :key="cog"
                      class="py-2 px-2 text-center whitespace-nowrap"
                      :class="cog === z2 ? 'text-primary font-semibold' : ''"
                    >{{ cog }}T</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in matrixRows"
                    :key="row.ring"
                    class="border-b border-border/60"
                  >
                    <th
                      class="py-1.5 px-2 text-left font-medium whitespace-nowrap"
                      :class="row.ring === z1 ? 'text-primary' : 'text-muted-foreground'"
                    >{{ row.ring }}T</th>
                    <td
                      v-for="(cell, ci) in row.cells"
                      :key="ci"
                      class="py-1.5 px-2 text-center rounded"
                      :class="row.ring === z1 && COG_PRESETS[ci] === z2 ? 'bg-primary/10 font-semibold text-primary' : 'text-muted-foreground'"
                    >{{ cell }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
              表内为速比（保留 2 位小数）；乘以轮周长即发展米数，再乘踏频 ×0.06 即车速。当前档位已高亮。
            </p>
          </div>
        </template>

        <div v-else class="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
          请输入有效的牙盘与飞轮齿数
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>发展米数与 gear inches：两种传动口径</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          同一个传动比有两种主流表达：
          <span class="font-medium text-foreground">发展米数（development / meters of development）</span>是欧洲与中国常用的口径，
          = 速比 × 轮径展开周长，直接告诉你"踏一圈前进几米"——50/11 配 700c（周长 2.1m）发展约 9.55m，90rpm 就是 51.6km/h；
          <span class="font-medium text-foreground">gear inches（齿轮英寸）</span>是英美传统口径，
          = 速比 × 车轮直径（英寸，700c≈26.3"），源自高轮自行车时代"相当于多大前轮"的直觉对比。
          两者只差一个固定系数：gear inches ≈ 发展米数 × 12.53，本页两种口径同时给出。
          越野圈还有人用"gain ratio"（踏板位移/轮位移之比），它不依赖轮径，但日常骑行不如前两者直观。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么爬坡要换小比？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          踩踏功率 = 扭矩 × 转速。爬坡时速度低、需要的力量大，用大比意味着每一踏都要输出高扭矩：
          快肌纤维很快疲劳、心率虽然不高但腿先"爆缸"，膝盖在低踏频高负荷下受到的压力也更大。
          换小比（小盘 × 大飞）后同样的车速可以用更高踏频、更低单踏力量完成，把负荷转回有氧系统——
          这就是"爬坡用腿换肺"。经验是保持踏频 70rpm 以上爬坡，宁可慢一点也不要硬踩大比。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">踏频 80-90 的"黄金区间"是怎么回事？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          研究与训练经验普遍把长时骑行的高效踏频放在 80-90rpm：
          低于 70rpm 单踏扭矩大、肌肉与膝盖负担重，久骑容易抽筋与膝痛；
          高于 100rpm 心率上升快、身体上下晃动增加，业余骑手难以稳定维持。
          80-90 附近是"心血管负担适中 + 肌肉负担适中"的折中，职业车手巡航常在 90-100，
          业余爱好者从 85 左右找自己的节奏即可——踏频稳定比偶尔冲高更重要。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">单速车 / 固齿怎么选传动比？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          单速车没有变速兜底，齿比要在"起步不憋"与"巡航不空转"之间取折中：
          城市通勤 700c 常用速比 2.6-3.0（如 44×16≈2.75，发展约 5.8m，90rpm 约 31km/h），
          多坡城市可降到 2.3-2.6，平坦快速通勤或场地取向可到 3.0-3.3。
          选法很简单：带上几片不同齿数的飞轮试骑最常走的路线，"最陡的那个坡能以可接受的用力起步、
          最常用路段不觉得腿空"的那一档就是答案。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div v-for="(faq, index) in faqs" :key="index">
            <h3 class="text-base font-semibold text-foreground">{{ faq.q }}</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">{{ faq.a }}</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :current-tool-id="'cycling-gear-ratio'" :category="'calculate'" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  Bike, Info, ChevronUp, ChevronDown,
  Cog, Gauge, RefreshCw
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'cycling-gear-ratio'
const STORAGE_KEY = 'cycling-gear-ratio-inputs'

// ---------- SEO ----------
useSeoMeta({
  title: '骑行传动比计算 - 速比/发展米数/踏频车速换算 | 有条工具',
  description: '免费在线骑行传动比计算器：牙盘×飞轮速比、发展米数（速比×轮周长）、踏频→车速换算与 gear inches，附常见套件最大/最小比范围与全齿比速查表，纯本地计算。',
  keywords: '骑行传动比,发展米数,速比计算,牙盘飞轮,踏频车速,gear inches,齿比表,公路车变速',
  author: '有条工具',
  ogTitle: '骑行传动比计算 - 速比/发展米数/踏频车速换算 | 有条工具',
  ogDescription: '牙盘×飞轮→速比与发展米数，踏频→车速，全齿比速查表与套件范围对照。',
  ogUrl: 'https://www.util.cn/tools/cycling-gear-ratio',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// ---------- 纯逻辑（可独立单测） ----------
// __PURE_FNS_START__
function round1(n: number): number { return Math.round(n * 10) / 10 }
function round2(n: number): number { return Math.round(n * 100) / 100 }
function round3(n: number): number { return Math.round(n * 1000) / 1000 }

// 预设：牙盘 / 飞轮 / 轮径展开周长（rollout，受胎宽气压影响，可自定义实测）
const CHAINRING_PRESETS = [34, 39, 46, 50, 52, 53]
const COG_PRESETS = [11, 12, 13, 14, 16, 19, 21, 23, 25, 28, 32, 34, 36, 42]
const RPM_PRESETS = [60, 80, 90, 100]
const WHEEL_PRESETS = [
  { id: '700c', label: '700c 2.10m', circ: 2.1 },
  { id: '26', label: '26寸 2.05m', circ: 2.05 },
  { id: '275', label: '27.5 2.20m', circ: 2.2 },
  { id: '29', label: '29寸 2.28m', circ: 2.28 }
]

// 速比 = Z1/Z2（3 位小数）；非法输入返回 null
function gearRatio(z1: number, z2: number) {
  const a = Number(z1), b = Number(z2)
  if (!(a > 0) || !(b > 0) || !Number.isFinite(a) || !Number.isFinite(b)) return null
  return round3(a / b)
}

// 发展米数 = 速比 × 轮周长（按精确速比计算后 2 位小数，避免中间取整误差）
function developmentM(z1: number, z2: number, circM: number) {
  const a = Number(z1), b = Number(z2), c = Number(circM)
  if (!(a > 0) || !(b > 0) || !(c > 0) || !Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c)) return null
  return round2((a / b) * c)
}

// 速度 km/h = 发展米数 × 踏频 × 0.06（0.06 = 60 分/h ÷ 1000 m/km）
function speedKmh(devM: number, rpm: number) {
  const d = Number(devM), r = Number(rpm)
  if (!(d > 0) || !(r > 0) || !Number.isFinite(d) || !Number.isFinite(r)) return null
  return round1(d * r * 0.06)
}

// gear inches = 速比 × 轮径英寸 = 发展米数 ÷（π × 0.0254）
function gearInches(z1: number, z2: number, circM: number) {
  const a = Number(z1), b = Number(z2), c = Number(circM)
  if (!(a > 0) || !(b > 0) || !(c > 0) || !Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c)) return null
  return round1((a / b) * (c / (Math.PI * 0.0254)))
}

// 全齿比矩阵：行 = 牙盘，列 = 飞轮，单元格速比（2 位小数）
function buildMatrix(rings: number[], cogs: number[]) {
  return rings.map((ring) => ({
    ring,
    cells: cogs.map((cog) => {
      const r = gearRatio(ring, cog)
      return r === null ? '—' : round2(r).toFixed(2)
    })
  }))
}

// 常见套件组合（覆盖通勤 / 公路 / 砾石主流配置）
const RANGE_COMBOS = [
  { label: '标准公路 53/39 × 11-28', big: 53, small: 39, cogMin: 11, cogMax: 28 },
  { label: '半紧凑 52/36 × 11-30', big: 52, small: 36, cogMin: 11, cogMax: 30 },
  { label: '紧凑公路 50/34 × 11-28', big: 50, small: 34, cogMin: 11, cogMax: 28 },
  { label: '砾石/长途 46/30 × 11-34', big: 46, small: 30, cogMin: 11, cogMax: 34 },
  { label: '单盘砾石 40 × 11-42', big: 40, small: 40, cogMin: 11, cogMax: 42 }
]

// 范围行：最大比 / 最小比 / 范围倍数（跳档感参考）/ 当前踏频最高速
function rangeRow(combo, circM: number, rpm: number) {
  const c = Number(circM), r = Number(rpm)
  if (!(c > 0) || !(r > 0)) return null
  const max = gearRatio(combo.big, combo.cogMin)
  const min = gearRatio(combo.small, combo.cogMax)
  if (max === null || min === null) return null
  const span = round2(max / min)
  const devMax = developmentM(combo.big, combo.cogMin, c)
  const topSpeed = devMax === null ? null : speedKmh(devMax, r)
  return { ...combo, max, min, span, topSpeed }
}

function buildRangeTable(circM: number, rpm: number) {
  return RANGE_COMBOS.map((combo) => rangeRow(combo, circM, rpm)).filter(Boolean)
}
// __PURE_FNS_END__

// ---------- 响应式状态 ----------
const z1 = ref<number>(50)
const z2 = ref<number>(11)
const wheelId = ref<string>('700c')
const customCirc = ref<number>(2.105)
const rpm = ref<number>(90)
const seoContentVisible = ref(true)

const faqs = [
  {
    q: '发展米数和 gear inches 怎么互相换算？',
    a: '两者只差一个固定系数：gear inches = 发展米数 ÷（π × 0.0254）≈ 发展米数 × 12.53。例如发展 9.55m 的档位约等于 119.6 gear inches。发展米数直观表达"踏一圈走多远"，gear inches 表达"相当于多大直径的前轮"，选齿比时用哪个都行，跨资料对比时注意口径。'
  },
  {
    q: '为什么爬坡要换到更小的传动比？',
    a: '小比降低每一踏所需的扭矩，让你用 70rpm 以上的踏频"用肺骑车"而不是"用腿硬顶"。低踏频大力量输出主要依赖快肌纤维、极易疲劳，还会明显加大膝盖压力。山区路线建议整车最小比 ≤1.2（如 34×28≈1.21 或换 11-32/11-34 飞轮）。'
  },
  {
    q: '踏频多少最合适？',
    a: '长时骑行的黄金区间是 80-90rpm：低于 70rpm 肌肉与膝盖负担重，高于 100rpm 心率飙升且业余骑手难稳定。爬坡可放宽到 70rpm 以上，冲刺时自然拉高。与其追求绝对数值，不如练习"在疲劳时仍能保持稳定踏频"，这是长途不爆缸的关键。'
  },
  {
    q: '单速车选多大的传动比合适？',
    a: '城市通勤 700c 常用速比 2.6-3.0（如 44×16≈2.75，发展约 5.8m）；多坡路段降到 2.3-2.6，平坦快速通勤可到 3.0-3.3。选比原则：最陡的常用坡能以可接受的用力起步，最常用的巡航路段不觉得腿空。条件允许时多带几片飞轮实测试骑最可靠。'
  },
  {
    q: '轮径周长用什么数字？',
    a: '本页按展开周长（rollout）预设：700c≈2.10m、26 寸≈2.05m、27.5≈2.20m、29 寸≈2.28m，均为常见胎宽的近似值。周长受胎宽与气压影响，精确做法是给地面做标记推行一圈实测，再把实测值填入"自定义"，测速码表也用同一口径标定。'
  }
]

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: '骑行传动比计算',
          url: 'https://www.util.cn/tools/cycling-gear-ratio',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['速比 = 牙盘÷飞轮', '发展米数 = 速比×轮周长', '踏频→车速换算（×0.06）', 'gear inches 换算', '常见套件最大/最小比与范围倍数', '全齿比速查矩阵', '轮径周长预设与自定义']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '骑行传动比计算', item: 'https://www.util.cn/tools/cycling-gear-ratio' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.q,
            acceptedAnswer: { '@type': 'Answer', text: faq.a }
          }))
        }
      ]
    })
  }]
})

// ---------- 派生结果 ----------
const circM = computed(() => {
  if (wheelId.value === 'custom') {
    const v = Number(customCirc.value)
    return Number.isFinite(v) && v > 0 ? v : 0
  }
  const w = WHEEL_PRESETS.find(x => x.id === wheelId.value)
  return w ? w.circ : 0
})

const wheelLabel = computed(() => {
  if (wheelId.value === 'custom') return `自定义 ${circM.value}m`
  const w = WHEEL_PRESETS.find(x => x.id === wheelId.value)
  return w ? w.label : '—'
})

const gearResult = computed(() => {
  if (!(circM.value > 0)) return null
  const ratio = gearRatio(z1.value, z2.value)
  const dev = developmentM(z1.value, z2.value, circM.value)
  if (ratio === null || dev === null) return null
  const speed = speedKmh(dev, rpm.value)
  const speed60 = speedKmh(dev, 60)
  const speed100 = speedKmh(dev, 100)
  const inches = gearInches(z1.value, z2.value, circM.value)
  if (speed === null || inches === null) return null
  return { ratio: ratio.toFixed(3), dev: dev.toFixed(2), speed, speed60, speed100, inches }
})

const rangeTable = computed(() => {
  if (!(circM.value > 0)) return []
  return buildRangeTable(circM.value, rpm.value) as NonNullable<ReturnType<typeof rangeRow>>[]
})

const matrixRows = computed(() => buildMatrix(CHAINRING_PRESETS, COG_PRESETS))

// ---------- 操作（纯本地状态，SSR 安全） ----------
const DEFAULT_INPUTS = { z1: 50, z2: 11, wheelId: '700c', customCirc: 2.105, rpm: 90 }

function resetInputs() {
  z1.value = DEFAULT_INPUTS.z1
  z2.value = DEFAULT_INPUTS.z2
  wheelId.value = DEFAULT_INPUTS.wheelId
  customCirc.value = DEFAULT_INPUTS.customCirc
  rpm.value = DEFAULT_INPUTS.rpm
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 持久化：仅客户端交互回调中写 localStorage（键前缀 = 工具 id）
watch([z1, z2, wheelId, customCirc, rpm], () => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        z1: z1.value,
        z2: z2.value,
        wheelId: wheelId.value,
        customCirc: customCirc.value,
        rpm: rpm.value
      }))
    }
  } catch (e) { /* localStorage 不可用时忽略 */ }
})

onMounted(() => {
  addRecentTool(TOOL_ID)
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const s = JSON.parse(raw)
      if (typeof s.z1 === 'number' && s.z1 > 0) z1.value = s.z1
      if (typeof s.z2 === 'number' && s.z2 > 0) z2.value = s.z2
      if (typeof s.wheelId === 'string' && (WHEEL_PRESETS.some(w => w.id === s.wheelId) || s.wheelId === 'custom')) wheelId.value = s.wheelId
      if (typeof s.customCirc === 'number' && s.customCirc > 0) customCirc.value = s.customCirc
      if (typeof s.rpm === 'number' && s.rpm > 0) rpm.value = s.rpm
    }
  } catch (e) { /* localStorage 不可用时忽略 */ }
})
</script>
