<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Compass class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">露营装备清单生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">按场景×人数×自驾条件生成装备清单，新手露营照单备齐</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        选择露营场景（日间野餐/过夜露营/冬季露营）、人数、是否自驾与是否带小孩，自动生成分类装备清单：
        营地搭建、睡眠系统、炊事炉具、照明、折叠桌椅、燃料、保暖（冬季）与儿童用品。
        自驾车营可放心带天幕、折叠桌椅等大件；徒步背负时大件自动标注重量并给出「轻量化」精简建议。
        逐项勾选带进度条，勾选状态保存在本机浏览器，支持复制与打印。全部本地计算。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 tools-grid">
      <!-- 左侧：条件输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4 no-print lg:sticky lg:top-20 self-start">
        <h2 class="text-lg font-semibold flex items-center">
          <SlidersHorizontal class="w-5 h-5 mr-2 text-primary" /> 露营条件
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">露营场景</label>
          <div class="space-y-1.5">
            <button
              v-for="s in SCENES"
              :key="s.value"
              @click="scene = s.value"
              :class="scene === s.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left"
            >
              <component :is="SCENE_ICON_MAP[s.icon]" class="w-4 h-4 flex-shrink-0" /> {{ s.label }}
            </button>
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">{{ currentSceneHint }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2" for="peopleInput">人数（1-20）</label>
          <input
            id="peopleInput"
            v-model.number="people"
            type="number"
            min="1"
            max="20"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div class="space-y-2">
          <label class="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/50 cursor-pointer">
            <input
              v-model="selfDrive"
              type="checkbox"
              class="w-4 h-4 rounded border-border accent-primary"
            />
            <span class="text-sm text-foreground">自驾车营<span class="text-xs text-muted-foreground ml-1">（可带大件）</span></span>
          </label>
          <label class="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/50 cursor-pointer">
            <input
              v-model="hasKids"
              type="checkbox"
              class="w-4 h-4 rounded border-border accent-primary"
            />
            <span class="text-sm text-foreground">带小孩<span class="text-xs text-muted-foreground ml-1">（追加儿童用品）</span></span>
          </label>
          <p v-if="!selfDrive" class="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
            <Footprints class="w-4 h-4 flex-shrink-0 mt-0.5" /> 徒步背负模式：大件装备已标注重量并附轻量化替代建议
          </p>
        </div>

        <div class="pt-2 border-t border-border space-y-2">
          <button
            @click="copyList"
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all"
          >
            <Copy class="w-4 h-4" /> {{ copyLabel }}
          </button>
          <div class="flex gap-2">
            <button
              @click="printList"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-all"
            >
              <Printer class="w-4 h-4" /> 打印清单
            </button>
            <button
              @click="resetChecks"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-all"
            >
              <RotateCcw class="w-4 h-4" /> 清空勾选
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：装备清单 -->
      <div class="lg:col-span-2 space-y-6 print-area">
        <!-- 进度卡片 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-2 no-print">
            <h2 class="text-lg font-semibold flex items-center">
              <Luggage class="w-5 h-5 mr-2 text-primary" /> 装车进度
            </h2>
            <span class="text-sm text-muted-foreground">{{ checkedCount }} / {{ totalItems }} 件</span>
          </div>
          <div class="h-3 bg-muted rounded-full overflow-hidden no-print">
            <div
              class="h-full bg-primary transition-all duration-300"
              :style="{ width: progressPercent + '%' }"
            ></div>
          </div>
          <div class="print-only text-sm text-neutral-600">装车进度：{{ checkedCount }} / {{ totalItems }} 件</div>
          <p class="text-xs text-muted-foreground mt-2 no-print flex items-center gap-1.5">
            <Save class="w-3.5 h-3.5" /> 勾选状态自动保存在本机浏览器；{{ conditionSummary }}
          </p>
        </div>

        <!-- 打印表头 -->
        <div class="print-only text-center mb-2">
          <h2 class="text-xl font-bold text-neutral-900">露营装备清单</h2>
          <p class="text-xs text-neutral-500 mt-1">{{ conditionSummary }}</p>
        </div>

        <!-- 分类清单 -->
        <div
          v-for="group in generated.groups"
          :key="group.name"
          class="bg-card border border-border rounded-lg p-6"
        >
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-foreground flex items-center">
              <component :is="groupIcon(group.name)" class="w-4 h-4 mr-2 text-primary" />
              {{ group.name }}
            </h3>
            <span class="text-xs text-muted-foreground no-print">{{ groupDone(group) }}/{{ group.items.length }}</span>
          </div>
          <ul class="space-y-1.5">
            <li v-for="item in group.items" :key="item.id">
              <label
                class="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/40 cursor-pointer transition-colors"
                :class="isChecked(item.id) ? 'opacity-60' : ''"
              >
                <input
                  type="checkbox"
                  class="w-4 h-4 mt-0.5 rounded border-border accent-primary flex-shrink-0"
                  :checked="isChecked(item.id)"
                  @change="toggleItem(item.id)"
                />
                <span class="text-sm">
                  <span class="text-foreground" :class="isChecked(item.id) ? 'line-through' : ''">{{ item.name }}</span>
                  <span v-if="item.note" class="text-muted-foreground text-xs ml-1.5">（{{ item.note }}）</span>
                  <span v-if="item.weightWarn" class="ml-1.5 inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium">
                    <AlertTriangle class="w-3 h-3" /> 重 {{ item.kg }}，徒步背负慎选
                  </span>
                  <span v-if="item.lightTag" class="ml-1.5 inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-medium">
                    <Feather class="w-3 h-3" /> 轻量化
                  </span>
                </span>
              </label>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative no-print">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10"
        :aria-label="seoContentVisible ? '收起说明' : '展开说明'"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于露营装备清单</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            新手露营最容易犯的错误是「装备带不全」和「大件带太多」：忘带地钉营锤搭不起天幕，
            或者徒步进山还背了整套折叠桌椅。本工具按场景、人数与到达方式（自驾/徒步）自动过滤装备目录，
            自驾车营放心带大件，徒步背负时自动给大件标重量并给出轻量化替代建议，照单装车即可。
          </p>
          <h3 class="text-lg font-semibold text-foreground">三种场景怎么选装备</h3>
          <p>
            「日间野餐」只带遮阳（天幕）、坐卧（防潮垫/野餐垫）、炊事餐具与照明，傍晚撤营；
            「过夜露营」追加睡眠系统（帐篷、睡袋、防潮垫）、营地灯头灯与足量燃料；
            「冬季露营」在过夜基础上再叠加保暖模块——加厚睡袋、抓绒内胆、暖宝宝与保温杯，
            取暖炉仅自驾场景推荐（注意帐篷内一氧化碳风险）。
          </p>
          <h3 class="text-lg font-semibold text-foreground">自驾与徒步的差异</h3>
          <p>
            自驾车营（Car Camping）装备重量几乎无约束，天幕、折叠桌椅、保温箱、氛围灯尽管带；
            徒步背负（Backpacking）每多一公斤都是负担，清单会给约 3kg 以上的大件打上重量警告，
            并提供「轻量化」标记与替代思路：如天幕→登山杖+雨衣、成套桌椅→餐盒坐地、营地灯→头灯向上打光。
          </p>
          <h3 class="text-lg font-semibold text-foreground">数量按人数自动折算</h3>
          <p>
            睡袋、防潮垫、折叠椅、餐具按人数一人份；卡式气罐约每 2 人 1 罐（48h 三餐）；
            天幕、帐篷按每 3-4 人 1 顶折算；冬季暖宝宝按每人 2 片备用。备注里的数量只是起点，
            实际按行程强度增减。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">睡袋温标怎么选？</span>看「舒适温标」而非「极限温标」：夏季营地选舒适 5~15°C，三季选 0~5°C，冬季需 -10°C 以下并搭配抓绒内胆，宁可买高不凑合。</li>
            <li><span class="text-foreground font-medium">冬季露营可以在帐篷里烧炉取暖吗？</span>存在一氧化碳中毒与明火风险，必须选择有烟囱的柴火炉并保持持续通风，睡前清炉；新手更推荐高温标睡袋+暖宝宝方案，取暖炉仅在自驾场景慎重使用。</li>
            <li><span class="text-foreground font-medium">勾选数据会丢吗？</span>勾选状态保存在本机浏览器 localStorage，不上传服务器；清浏览器数据或换设备会重置，出发前建议复制或打印一份。</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :currentToolId="'camping-gear-checklist'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Compass, SlidersHorizontal, Copy, Printer, RotateCcw, Save, Luggage,
  ChevronUp, ChevronDown, AlertTriangle, Feather, Footprints,
  Tent, Flame, Moon, UtensilsCrossed, Lamp, Armchair, Baby, Wrench
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '露营装备清单生成器 - 按场景人数自驾条件生成',
  description: '在线露营装备清单生成器，按露营场景（野餐/过夜/冬季）、人数、是否自驾、是否带小孩自动生成天幕帐篷睡袋炉具照明等分类清单，徒步模式自动标注重量并给轻量化建议，支持勾选进度、本机保存、复制与打印',
  keywords: '露营装备清单, 露营要带什么, 过夜露营装备, 野餐清单, 冬季露营装备, 轻量化露营, 新手露营准备',
  author: '有条工具',
  ogTitle: '露营装备清单生成器 - 有条工具',
  ogDescription: '按场景×人数×自驾条件生成露营装备清单，新手照单备齐',
  ogUrl: 'https://www.util.cn/tools/camping-gear-checklist',
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
          name: '露营装备清单生成器',
          url: 'https://www.util.cn/tools/camping-gear-checklist',
          applicationCategory: 'TravelApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['野餐/过夜/冬季三场景', '人数自动折算数量', '自驾与徒步重量提示', '轻量化替代建议', '勾选进度与本机保存', '复制与打印']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '露营装备清单生成器', item: 'https://www.util.cn/tools/camping-gear-checklist/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '睡袋温标怎么选？',
              acceptedAnswer: { '@type': 'Answer', text: '看舒适温标而非极限温标：夏季选舒适 5~15°C，三季选 0~5°C，冬季需 -10°C 以下并搭配抓绒内胆。' }
            },
            {
              '@type': 'Question',
              name: '冬季露营可以在帐篷里烧炉取暖吗？',
              acceptedAnswer: { '@type': 'Answer', text: '存在一氧化碳中毒与明火风险，必须使用带烟囱的柴火炉并保持持续通风、睡前清炉；新手更推荐高温标睡袋加暖宝宝方案。' }
            },
            {
              '@type': 'Question',
              name: '勾选数据会丢吗？',
              acceptedAnswer: { '@type': 'Answer', text: '勾选状态仅保存在本机浏览器 localStorage，不上传服务器；清除浏览器数据或换设备会重置，出发前建议复制或打印一份。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'camping-gear-checklist')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

/* ==== PURE:BEGIN ==== */
// 装备目录：scenes 命中标签；big/kkg 供徒步模式重量警告；light 为轻量化替代建议；
// qty: 'per' 每人份 / 'pair' 每2人1 / 'group' 每4人1 / 'fix' 固定
const GEAR_CATALOG = [
  // 营地搭建
  { id: 'tarp', cat: '营地搭建', name: '天幕+营柱', scenes: ['picnic', 'overnight'], qty: 'group', kg: 3.2, light: '登山杖+雨衣替代', note: '遮阳挡雨主场地' },
  { id: 'tent', cat: '营地搭建', name: '帐篷', scenes: ['overnight'], qty: 'group', kg: 2.8, light: '1-2kg 超轻帐', note: '按 2-3 人一顶折算' },
  { id: 'groundsheet', cat: '营地搭建', name: '地布/野餐垫', scenes: ['picnic', 'overnight'], qty: 'fix', note: '铺帐篷下或草地' },
  { id: 'stakes', cat: '营地搭建', name: '地钉+营锤', scenes: ['picnic', 'overnight'], qty: 'fix', note: '风大加风绳' },
  // 睡眠系统
  { id: 'sleeping-bag', cat: '睡眠系统', name: '睡袋', scenes: ['overnight'], qty: 'per', note: '按营地夜间温标选' },
  { id: 'pad', cat: '睡眠系统', name: '防潮垫/充气垫', scenes: ['overnight'], qty: 'per', kg: 1.2, note: '隔绝地面寒气' },
  { id: 'pillow', cat: '睡眠系统', name: '枕头/枕囊', scenes: ['overnight'], qty: 'per', note: '衣物塞收纳袋可代' },
  // 炊事炉具
  { id: 'stove', cat: '炊事炉具', name: '卡式炉/套炉', scenes: ['picnic', 'overnight'], qty: 'pair', kg: 2.5, light: '一体式小炉头', note: '两人一炉够用' },
  { id: 'fuel', cat: '炊事炉具', name: '燃料气罐', scenes: ['picnic', 'overnight'], qty: 'pair', note: '每 2 人 1 罐备余量' },
  { id: 'cookware', cat: '炊事炉具', name: '炊具套锅+铲夹', scenes: ['picnic', 'overnight'], qty: 'pair', note: '含烧水壶' },
  { id: 'tableware', cat: '炊事炉具', name: '餐具碗筷杯勺', scenes: ['picnic', 'overnight'], qty: 'per' },
  { id: 'cooler', cat: '炊事炉具', name: '保温箱/食材包', scenes: ['picnic', 'overnight'], qty: 'group', kg: 4.0, light: '软冰袋替代', note: '肉类冷饮保鲜' },
  { id: 'trash', cat: '炊事炉具', name: '垃圾袋+湿巾', scenes: ['picnic', 'overnight'], qty: 'fix', note: '无痕露营带走垃圾' },
  // 照明
  { id: 'lantern', cat: '照明', name: '营地灯', scenes: ['picnic', 'overnight'], qty: 'group', note: '续航按 2 晚备' },
  { id: 'headlamp', cat: '照明', name: '头灯+备用电池', scenes: ['overnight'], qty: 'per', note: '夜起与徒步必备' },
  // 桌椅
  { id: 'furniture', cat: '折叠桌椅', name: '折叠桌椅', scenes: ['picnic', 'overnight'], qty: 'pair', kg: 6.0, light: '仅带折叠椅或餐盒坐地', note: '椅按人数' },
  // 保暖（冬季）
  { id: 'hotpack', cat: '保暖御寒', name: '暖宝宝', scenes: ['winter'], qty: 'per2', note: '每人 2 片备用' },
  { id: 'liner', cat: '保暖御寒', name: '抓绒睡袋内胆', scenes: ['winter'], qty: 'per' },
  { id: 'thermos', cat: '保暖御寒', name: '保温壶', scenes: ['winter'], qty: 'group', note: '热水随取' },
  { id: 'wood-stove', cat: '保暖御寒', name: '柴火炉/取暖炉', scenes: ['winter'], qty: 'fix', kg: 8.0, selfDriveOnly: true, light: '冬季轻装不建议生炉', note: '帐篷内使用须防一氧化碳' },
  { id: 'coldsleep', cat: '保暖御寒', name: '加厚睡袋（-10°C 舒适温标）', scenes: ['winter'], qty: 'per', note: '替代夏季睡袋' },
  // 儿童用品
  { id: 'kid-bag', cat: '儿童用品', name: '儿童睡袋', scenes: ['picnic', 'overnight', 'winter'], kid: true, qty: 'fix' },
  { id: 'kid-kit', cat: '儿童用品', name: '儿童餐具+水杯', scenes: ['picnic', 'overnight', 'winter'], kid: true, qty: 'fix' },
  { id: 'kid-toy', cat: '儿童用品', name: '玩沙工具/飞盘/泡泡机', scenes: ['picnic', 'overnight', 'winter'], kid: true, qty: 'fix', note: '解放大人两小时' },
  { id: 'kid-safe', cat: '儿童用品', name: '儿童药品+防蚊+创可贴', scenes: ['picnic', 'overnight', 'winter'], kid: true, qty: 'fix' },
  // 工具杂项
  { id: 'firstaid', cat: '工具杂项', name: '急救包', scenes: ['picnic', 'overnight'], qty: 'fix', note: '含常用药与绷带' },
  { id: 'knife', cat: '工具杂项', name: '多功能刀+开瓶器', scenes: ['picnic', 'overnight'], qty: 'fix' },
  { id: 'sunscreen', cat: '工具杂项', name: '防晒霜+驱蚊液', scenes: ['picnic', 'overnight'], qty: 'fix' }
]

const CAT_ORDER = ['营地搭建', '睡眠系统', '炊事炉具', '照明', '折叠桌椅', '保暖御寒', '儿童用品', '工具杂项']

const clampPeople = (p) => Math.min(20, Math.max(1, Math.round(Number(p) || 1)))

const qtyText = (qty, peopleN) => {
  if (qty === 'per') return '×' + peopleN + '（每人）'
  if (qty === 'pair') return '×' + Math.max(1, Math.ceil(peopleN / 2)) + '（每 2 人）'
  if (qty === 'group') return '×' + Math.max(1, Math.ceil(peopleN / 4)) + '（每 4 人）'
  if (qty === 'per2') return '×' + (peopleN * 2) + '（每人 2）'
  return ''
}

// 场景展开：冬季露营必然包含过夜装备
const neededScenes = (scene) => (scene === 'winter' ? ['overnight', 'winter'] : [scene])

// 生成装备清单；selfDrive=false 视为徒步背负
const buildGear = ({ scene, people, selfDrive, hasKids }) => {
  const need = neededScenes(scene)
  const n = clampPeople(people)
  const kids = !!hasKids
  const picked = GEAR_CATALOG.filter((it) => {
    if (!it.scenes.some((s) => need.includes(s))) return false
    if (it.kid && !kids) return false
    if (it.selfDriveOnly && !selfDrive) return false
    return true
  })
  const groups = CAT_ORDER
    .map((name) => ({
      name,
      items: picked
        .filter((it) => it.cat === name)
        .map((it) => {
          const q = qtyText(it.qty, n)
          let note = [q, it.note].filter(Boolean).join(' · ')
          let weightWarn = false
          let lightTag = false
          // 徒步背负模式：约 2.5kg 以上的大件标注重量警告，有替代方案的打「轻量化」标
          if (!selfDrive && it.kg >= 2.5) {
            weightWarn = true
            if (it.light) {
              note = [note, '徒步建议：' + it.light].filter(Boolean).join(' · ')
              lightTag = true
            }
          }
          return {
            id: it.id,
            name: it.name,
            note,
            weightWarn,
            lightTag,
            kg: it.kg ? '≈' + it.kg + 'kg' : ''
          }
        })
    }))
    .filter((g) => g.items.length > 0)
  return { groups, total: picked.length, people: n }
}
/* ==== PURE:END ==== */

// ---------- 选项与状态 ----------
const SCENES = [
  { value: 'picnic', label: '日间野餐', hint: '不过夜：遮阳、坐卧、炊事餐具为主，傍晚撤营', icon: 'Compass' },
  { value: 'overnight', label: '过夜露营', hint: '追加帐篷睡袋等睡眠系统与夜间照明', icon: 'Moon' },
  { value: 'winter', label: '冬季露营', hint: '过夜装备 + 保暖模块（暖宝宝、加厚睡袋）', icon: 'Flame' }
]

const STORAGE_KEY = 'camping-gear-checked-v1'

const scene = ref('overnight')
const people = ref(4)
const selfDrive = ref(true)
const hasKids = ref(false)
const checked = ref({})
const copyLabel = ref('复制清单')
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const currentScene = computed(() => SCENES.find((s) => s.value === scene.value) || SCENES[0])
const currentSceneHint = computed(() => currentScene.value.hint)

const generated = computed(() =>
  buildGear({
    scene: scene.value,
    people: people.value,
    selfDrive: selfDrive.value,
    hasKids: hasKids.value
  })
)

const totalItems = computed(() => generated.value.total)

const checkedCount = computed(() => {
  let c = 0
  generated.value.groups.forEach((g) => g.items.forEach((it) => {
    if (checked.value[it.id]) c++
  }))
  return c
})

const progressPercent = computed(() =>
  totalItems.value ? Math.round((checkedCount.value / totalItems.value) * 100) : 0
)

const conditionSummary = computed(() => {
  const parts = [
    currentScene.value.label,
    generated.value.people + ' 人',
    selfDrive.value ? '自驾车营' : '徒步背负',
    hasKids.value ? '带小孩' : ''
  ]
  return parts.filter(Boolean).join(' · ')
})

// ---------- 勾选与持久化 ----------
const isChecked = (id) => !!checked.value[id]

const persist = () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checked.value))
  } catch (e) { /* 隐私模式静默 */ }
}

const restore = () => {
  if (typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) checked.value = JSON.parse(raw) || {}
  } catch (e) {
    checked.value = {}
  }
}

onMounted(() => { restore() })

const toggleItem = (id) => {
  if (checked.value[id]) delete checked.value[id]
  else checked.value[id] = true
  persist()
}

const resetChecks = () => {
  checked.value = {}
  persist()
}

const groupDone = (group) => group.items.filter((it) => checked.value[it.id]).length

const GROUP_ICONS = {
  '营地搭建': Tent,
  '睡眠系统': Moon,
  '炊事炉具': UtensilsCrossed,
  '照明': Lamp,
  '折叠桌椅': Armchair,
  '保暖御寒': Flame,
  '儿童用品': Baby,
  '工具杂项': Wrench
}
const groupIcon = (name) => GROUP_ICONS[name] || Wrench

// 场景按钮图标（SCENES 中存字符串名，模板用 component :is 需要真实组件）
const SCENE_ICON_MAP = { Compass, Moon, Flame }

// ---------- 复制 / 打印 ----------
const buildListText = () => {
  const lines = ['露营装备清单（' + conditionSummary.value + '）', '进度：' + checkedCount.value + '/' + totalItems.value, '']
  generated.value.groups.forEach((g) => {
    lines.push('【' + g.name + '】')
    g.items.forEach((it) => {
      let line = (checked.value[it.id] ? '[x] ' : '[ ] ') + it.name
      const extras = [it.note, it.weightWarn ? ('重量警告 ' + it.kg + '，徒步慎选') : '']
        .filter(Boolean)
        .join(' · ')
      if (extras) line += '（' + extras + '）'
      lines.push(line)
    })
    lines.push('')
  })
  return lines.join('\n').trim()
}

const copyList = async () => {
  const text = buildListText()
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copyLabel.value = '已复制 ✓'
  } catch (e) {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand('copy')
      copyLabel.value = '已复制 ✓'
    } catch (e2) {
      copyLabel.value = '复制失败'
    }
    document.body.removeChild(ta)
  }
  setTimeout(() => { copyLabel.value = '复制清单' }, 2000)
}

const printList = () => {
  window.print()
}
</script>

<style scoped>
.print-only {
  display: none;
}

@media print {
  .no-print {
    display: none !important;
  }

  .tools-grid {
    display: block !important;
  }

  .print-only {
    display: block;
  }

  .print-area {
    border: none !important;
  }

  .bg-card {
    border: none !important;
    padding: 0 0 12px 0 !important;
  }

  ul li {
    break-inside: avoid;
  }
}
</style>
