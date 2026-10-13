<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Route class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">地图坐标转换</h1>
          <p class="text-sm text-muted-foreground mt-1">WGS-84 / GCJ-02 火星坐标 / BD-09 百度坐标三系互转，支持批量</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        GPS 原始坐标（WGS-84）、国测局火星坐标（GCJ-02，高德/腾讯/谷歌中国）与百度坐标（BD-09）互相转换，支持单点与批量粘贴（每行 纬度,经度），结果可一键复制。内置公开的克拉索夫斯基椭球偏移算法，全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：单点转换 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <MapPin class="w-5 h-5 mr-2 text-primary" /> 单点转换
        </h2>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">源坐标系</label>
            <select
              v-model="sourceSystem"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option v-for="sys in coordSystems" :key="sys.value" :value="sys.value">{{ sys.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">目标坐标系</label>
            <select
              v-model="targetSystem"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option v-for="sys in coordSystems" :key="sys.value" :value="sys.value">{{ sys.label }}</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">纬度 lat（-90 ~ 90）</label>
            <input
              v-model="singleLat"
              type="text"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="39.9042"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">经度 lng（-180 ~ 180）</label>
            <input
              v-model="singleLng"
              type="text"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="116.4074"
            />
          </div>
        </div>

        <button
          @click="swapSystems"
          class="w-full bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeftRight class="w-4 h-4" /> 交换源与目标
        </button>

        <!-- 单点结果 -->
        <div v-if="singleResult" class="bg-primary/10 rounded-lg p-4">
          <p class="text-xs text-muted-foreground mb-1">{{ sourceLabel }} → {{ targetLabel }}</p>
          <p class="text-lg font-bold font-mono text-primary break-all">
            {{ singleResult.lat }}, {{ singleResult.lng }}
          </p>
          <div class="flex items-center gap-3 mt-3">
            <button
              @click="copyText(singleResult.lat + ', ' + singleResult.lng)"
              class="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded text-xs transition-all flex items-center gap-1.5"
            >
              <Copy class="w-3 h-3" /> 复制结果
            </button>
            <span v-if="singleOffset && singleOffsetText" class="text-xs text-muted-foreground">
              偏移量 {{ singleOffsetText }}
            </span>
          </div>
        </div>
        <p v-else-if="singleError" class="text-xs text-destructive">{{ singleError }}</p>
        <p v-else class="text-xs text-muted-foreground">
          输入纬度与经度后自动转换。示例：北京天安门 WGS-84 约 39.9073,116.3912；GCJ-02 约 39.9087,116.3975。
        </p>
      </div>

      <!-- 中右侧：批量转换 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border flex-wrap gap-2">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <Layers class="w-5 h-5 mr-2 text-primary" /> 批量转换（每行 纬度,经度）
            </h2>
            <div class="flex items-center gap-2">
              <button
                @click="fillBatchSample"
                class="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-1.5 rounded text-sm transition-all"
              >
                样例
              </button>
              <button
                @click="clearBatch"
                class="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-1.5 rounded text-sm transition-all"
              >
                清空
              </button>
              <button
                @click="copyBatchResult"
                :disabled="!batchOutput"
                class="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
              >
                <Copy class="w-3.5 h-3.5" /> 复制结果
              </button>
            </div>
          </div>
          <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <textarea
              v-model="batchText"
              class="w-full h-64 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="每行一个坐标，纬度在前、经度在后（英文逗号或空格分隔）：&#10;39.9042,116.4074&#10;31.2304,121.4737&#10;22.5431,114.0579"
              spellcheck="false"
            ></textarea>
            <div class="overflow-auto h-64 border border-border rounded-lg">
              <table v-if="batchRows.length" class="w-full text-xs">
                <thead class="bg-muted sticky top-0">
                  <tr>
                    <th class="px-3 py-2 text-left font-medium text-foreground">#</th>
                    <th class="px-3 py-2 text-left font-medium text-foreground">输入（{{ sourceLabel }}）</th>
                    <th class="px-3 py-2 text-left font-medium text-foreground">输出（{{ targetLabel }}）</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, idx) in batchRows" :key="idx" class="border-t border-border">
                    <template v-if="row.ok">
                      <td class="px-3 py-1.5 text-muted-foreground">{{ idx + 1 }}</td>
                      <td class="px-3 py-1.5 font-mono text-muted-foreground whitespace-nowrap">{{ row.input }}</td>
                      <td class="px-3 py-1.5 font-mono text-foreground whitespace-nowrap">{{ row.output }}</td>
                    </template>
                    <template v-else>
                      <td class="px-3 py-1.5 text-muted-foreground">{{ idx + 1 }}</td>
                      <td class="px-3 py-1.5 font-mono text-muted-foreground">{{ row.input }}</td>
                      <td class="px-3 py-1.5 text-destructive whitespace-nowrap">{{ row.error }}</td>
                    </template>
                  </tr>
                </tbody>
              </table>
              <div v-else class="h-full flex items-center justify-center text-muted-foreground text-sm">
                <p>粘贴批量坐标后显示结果表</p>
              </div>
            </div>
          </div>
          <div v-if="batchInvalidCount" class="px-6 pb-4 flex items-start gap-2">
            <AlertTriangle class="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <p class="text-xs text-muted-foreground">{{ batchInvalidCount }} 行无法解析（纬度需 -90~90、经度需 -180~180），已跳过。</p>
          </div>
        </div>

        <!-- 坐标系说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 三种坐标系对照
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• <span class="text-foreground">WGS-84</span>：GPS 模块与海外地图（Google Maps 国际版）使用的原始大地坐标</li>
            <li>• <span class="text-foreground">GCJ-02</span>：国测局加密坐标（俗称火星坐标），高德、腾讯、谷歌中国地图使用</li>
            <li>• <span class="text-foreground">BD-09</span>：百度在 GCJ-02 基础上的二次加密坐标，百度地图使用</li>
            <li>• <span class="text-foreground">海外坐标</span>：中国大陆以外的坐标三系一致，转换时原样返回</li>
          </ul>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于地图坐标转换</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            国内 LBS 开发绕不开坐标系问题：设备 GPS 给的是 WGS-84 原始坐标，高德/腾讯地图展示要用 GCJ-02 火星坐标，百度地图又要 BD-09。拿 GPS 轨迹直接画在高德地图上会整体偏移几百米，这就是「火星坐标偏移」。本工具内置公开偏移算法，三系任意互转。
          </p>
          <h3 class="text-lg font-semibold text-foreground">转换算法说明</h3>
          <p>
            WGS-84 → GCJ-02 使用公开的克拉索夫斯基椭球（a=6378245，e²=0.00669342162296594323）偏移公式，按经纬度位置计算非线性偏移量；GCJ-02 → WGS-84 无官方逆公式，采用迭代逼近法反向求解，精度可达毫米级；GCJ-02 ↔ BD-09 使用百度的极坐标变换公式（z = √(x²+y²) + 0.00002·sin(y·π·3000/180)）。中国大陆以外区域三系一致，直接原样返回。
          </p>
          <h3 class="text-lg font-semibold text-foreground">精度与适用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>GPS 打点落在高德/腾讯地图：WGS-84 → GCJ-02</li>
            <li>GPS 打点落在百度地图：WGS-84 → GCJ-02 → BD-09</li>
            <li>高德坐标要进百度地图：GCJ-02 → BD-09；反向同理</li>
            <li>地理围栏、轨迹纠偏、POI 归一化等批量场景用批量模式整表粘贴</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">为什么 GCJ-02 转 WGS-84 不是精确解？</span>官方加密是单向非线性函数，没有公开逆公式，只能迭代逼近，国内范围内误差远小于 1 米，实际使用无影响。</li>
            <li><span class="text-foreground font-medium">为什么转换后坐标没变？</span>中国大陆以外坐标三系一致，工具按算法约定原样返回；请确认坐标位于境内。</li>
            <li><span class="text-foreground font-medium">坐标数据会上传吗？</span>不会。转换全部在浏览器本地完成，批量坐标也不离开你的电脑。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'gps-coordinate-converter'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Route, MapPin, Layers, ArrowLeftRight, Copy, Info,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '地图坐标转换 - WGS-84/GCJ-02火星/BD-09三系互转，支持批量',
  description: '在线地图坐标转换工具，WGS-84、GCJ-02火星坐标、BD-09百度坐标三系互转，内置公开克拉索夫斯基椭球偏移与迭代逼近算法，支持单点与批量粘贴转换、一键复制，LBS开发必备，纯本地计算',
  keywords: '地图坐标转换, 火星坐标转换, gcj02转wgs84, wgs84转gcj02, bd09坐标, gps纠偏, 坐标系转换工具',
  author: 'Util工具箱',
  ogTitle: '地图坐标转换 - 有条工具',
  ogDescription: 'WGS-84 / GCJ-02 火星坐标 / BD-09 三系互转，支持批量，LBS 开发必用',
  ogUrl: 'https://www.util.cn/tools/gps-coordinate-converter',
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
          '@type': 'WebApplication',
          name: '地图坐标转换',
          url: 'https://www.util.cn/tools/gps-coordinate-converter',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['WGS-84/GCJ-02/BD-09 三系互转', '克拉索夫斯基椭球偏移算法', 'GCJ-02→WGS-84 迭代逼近', '批量坐标转换', '一键复制结果']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: '地图坐标转换', item: 'https://www.util.cn/tools/gps-coordinate-converter/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么 GCJ-02 转 WGS-84 不是精确解？',
              acceptedAnswer: { '@type': 'Answer', text: '官方加密是单向非线性函数且无公开逆公式，工具采用迭代逼近反向求解，国内范围内误差远小于 1 米。' }
            },
            {
              '@type': 'Question',
              name: '为什么海外坐标转换后没有变化？',
              acceptedAnswer: { '@type': 'Answer', text: '中国大陆以外区域三种坐标系一致，按算法约定直接原样返回。' }
            },
            {
              '@type': 'Question',
              name: '坐标数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。单点与批量转换全部在浏览器本地完成。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'gps-coordinate-converter')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 纯函数区（node 可独立测试） ----------

const PI = Math.PI
const X_PI = (PI * 3000.0) / 180.0
// 克拉索夫斯基椭球参数
const CRS_A = 6378245.0
const CRS_EE = 0.00669342162296594323

// 是否在中国大陆坐标范围外（境外三系一致，直接返回）
const outOfChina = (lng, lat) => {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271
}

const transformLat = (x, y) => {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
  ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0
  ret += (160.0 * Math.sin(y / 12.0 * PI) + 320.0 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0
  return ret
}

const transformLng = (x, y) => {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
  ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0
  ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0
  return ret
}

// WGS-84 → GCJ-02（火星坐标）
const wgs84ToGcj02 = (lng, lat) => {
  if (outOfChina(lng, lat)) return { lng, lat }
  let dLat = transformLat(lng - 105.0, lat - 35.0)
  let dLng = transformLng(lng - 105.0, lat - 35.0)
  const radLat = (lat / 180.0) * PI
  let magic = Math.sin(radLat)
  magic = 1 - CRS_EE * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  dLat = (dLat * 180.0) / (((CRS_A * (1 - CRS_EE)) / (magic * sqrtMagic)) * PI)
  dLng = (dLng * 180.0) / ((CRS_A / sqrtMagic) * Math.cos(radLat) * PI)
  return { lng: lng + dLng, lat: lat + dLat }
}

// GCJ-02 → WGS-84（迭代逼近反向求解）
const gcj02ToWgs84 = (lng, lat) => {
  if (outOfChina(lng, lat)) return { lng, lat }
  let wLng = lng
  let wLat = lat
  for (let i = 0; i < 12; i++) {
    const g = wgs84ToGcj02(wLng, wLat)
    wLng += lng - g.lng
    wLat += lat - g.lat
  }
  return { lng: wLng, lat: wLat }
}

// GCJ-02 → BD-09（百度极坐标变换）
const gcj02ToBd09 = (lng, lat) => {
  const z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * X_PI)
  const theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * X_PI)
  return { lng: z * Math.cos(theta) + 0.0065, lat: z * Math.sin(theta) + 0.006 }
}

// BD-09 → GCJ-02
const bd09ToGcj02 = (lng, lat) => {
  const x = lng - 0.0065
  const y = lat - 0.006
  const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * X_PI)
  const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * X_PI)
  return { lng: z * Math.cos(theta), lat: z * Math.sin(theta) }
}

// 统一入口：任意两系互转（以 GCJ-02 为枢纽）
const convertCoord = (lng, lat, from, to) => {
  if (from === to) return { lng, lat }
  let cur = { lng, lat }
  if (from === 'wgs84') cur = wgs84ToGcj02(cur.lng, cur.lat)
  else if (from === 'bd09') cur = bd09ToGcj02(cur.lng, cur.lat)
  if (to === 'gcj02') return cur
  if (to === 'wgs84') return gcj02ToWgs84(cur.lng, cur.lat)
  if (to === 'bd09') return gcj02ToBd09(cur.lng, cur.lat)
  return cur
}

// 批量文本解析：每行 纬度,经度（兼容空格/制表符分隔）
const parseBatchLine = (line) => {
  const parts = String(line || '').trim().split(/[,，\t ]+/).filter(Boolean)
  if (parts.length < 2) return { ok: false, error: '格式错误' }
  const lat = Number(parts[0])
  const lng = Number(parts[1])
  if (!isFinite(lat) || !isFinite(lng)) return { ok: false, error: '非数字' }
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return { ok: false, error: '超出范围' }
  return { ok: true, lat, lng }
}

// ---------- 状态 ----------
const coordSystems = [
  { value: 'wgs84', label: 'WGS-84（GPS 原始）' },
  { value: 'gcj02', label: 'GCJ-02（火星/高德/腾讯）' },
  { value: 'bd09', label: 'BD-09（百度）' }
]

const sourceSystem = ref('wgs84')
const targetSystem = ref('gcj02')
const singleLat = ref('39.9042')
const singleLng = ref('116.4074')
const batchText = ref('')
const seoContentVisible = ref(true)

const systemLabel = (value) => {
  const found = coordSystems.find(s => s.value === value)
  return found ? found.label : value
}
const sourceLabel = computed(() => systemLabel(sourceSystem.value))
const targetLabel = computed(() => systemLabel(targetSystem.value))

const parsedSingle = computed(() => parseBatchLine(singleLat.value + ',' + singleLng.value))

const singleError = computed(() => {
  if (!singleLat.value.trim() && !singleLng.value.trim()) return ''
  if (!parsedSingle.value.ok) return parsedSingle.value.error
  return ''
})

const singleResult = computed(() => {
  if (!parsedSingle.value.ok) return null
  const r = convertCoord(parsedSingle.value.lng, parsedSingle.value.lat, sourceSystem.value, targetSystem.value)
  return {
    lat: Number(r.lat.toFixed(6)),
    lng: Number(r.lng.toFixed(6))
  }
})

const singleOffsetText = computed(() => {
  if (!singleResult.value || !parsedSingle.value.ok) return ''
  if (sourceSystem.value === targetSystem.value) return ''
  const dLat = Math.abs(singleResult.value.lat - parsedSingle.value.lat)
  const dLng = Math.abs(singleResult.value.lng - parsedSingle.value.lng)
  return 'dLat=' + dLat.toFixed(6) + '°, dLng=' + dLng.toFixed(6) + '°'
})

const swapSystems = () => {
  const tmp = sourceSystem.value
  sourceSystem.value = targetSystem.value
  targetSystem.value = tmp
  if (singleResult.value) {
    singleLat.value = String(singleResult.value.lat)
    singleLng.value = String(singleResult.value.lng)
  }
}

const batchRows = computed(() => {
  return String(batchText.value || '')
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => {
      const parsed = parseBatchLine(line)
      if (!parsed.ok) {
        return { ok: false, input: line.trim().slice(0, 32), error: parsed.error }
      }
      const r = convertCoord(parsed.lng, parsed.lat, sourceSystem.value, targetSystem.value)
      return {
        ok: true,
        input: parsed.lat + ',' + parsed.lng,
        output: Number(r.lat.toFixed(6)) + ',' + Number(r.lng.toFixed(6))
      }
    })
})

const batchInvalidCount = computed(() => batchRows.value.filter(r => !r.ok).length)

const batchOutput = computed(() => {
  const okRows = batchRows.value.filter(r => r.ok)
  if (!okRows.length) return ''
  return okRows.map(r => r.output).join('\n')
})

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

const fillBatchSample = () => {
  batchText.value = [
    '39.9042,116.4074',
    '31.2304,121.4737',
    '22.5431,114.0579',
    '30.5728,104.0668'
  ].join('\n')
}

const clearBatch = () => {
  batchText.value = ''
}

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制到剪贴板')
  } catch (err) {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('已复制到剪贴板')
  }
}

const copyBatchResult = () => copyText(batchOutput.value)
</script>
